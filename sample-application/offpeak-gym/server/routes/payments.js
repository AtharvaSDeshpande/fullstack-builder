import { Router } from 'express';
import crypto from 'node:crypto';

const router = Router();

// POST /api/payments/razorpay-order
router.post('/razorpay-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', bookingDetails = {} } = req.body;
    if (!amount) {
      return res.status(400).json({ success: false, error: 'Amount is required' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Smallest currency unit (cents/paise)
    const amountInSubunits = Math.round(Number(amount) * 100);

    // If live credentials are not set, use graceful sandbox order
    if (!keyId || !keySecret) {
      const mockOrderId = `order_mock_${Date.now()}`;
      return res.json({
        success: true,
        data: {
          isSandbox: true,
          keyId: 'rzp_test_mock',
          order: {
            id: mockOrderId,
            amount: amountInSubunits,
            currency,
            status: 'created',
          },
        },
      });
    }

    // Live Razorpay Orders API call
    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount: amountInSubunits,
        currency,
        receipt: `rcpt_${Date.now().toString().slice(-8)}`,
        notes: {
          bayName: bookingDetails.bayName || '',
          trainerId: bookingDetails.trainerId || '',
        },
      }),
    });

    const order = await response.json();
    if (!response.ok) {
      throw new Error(order.error?.description || 'Failed to create Razorpay live order');
    }

    return res.json({
      success: true,
      data: {
        isSandbox: false,
        keyId,
        order,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/payments/verify
router.post('/verify', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Sandbox mock payment verification
    if (!keySecret || razorpay_order_id?.startsWith('order_mock_')) {
      return res.json({
        success: true,
        verified: true,
        mode: 'sandbox',
        message: 'Sandbox payment verified',
      });
    }

    // Live HMAC SHA256 signature verification
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid payment signature' });
    }

    return res.json({ success: true, verified: true, mode: 'live' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
