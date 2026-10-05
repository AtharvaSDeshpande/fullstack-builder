import React, { useState } from 'react';
import { Paper, Typography, Box, Divider, Button, Alert } from '@mui/material';
import { CreditCard, ShieldCheck, Zap } from 'lucide-react';
import { calculateBookingBreakdown, initiateRazorpayPayment } from '../../integrations/razorpay';
import { formatINR } from '../../utils/currency';

export default function BookingSummaryCard({ bay, slot, onConfirm, loading, disabled, clientName, clientEmail }) {
  const [payError, setPayError] = useState('');
  const [authorizing, setAuthorizing] = useState(false);

  const hourlyRate = bay?.hourly_rate || 999.0;
  const breakdown = calculateBookingBreakdown(hourlyRate);

  const handlePayClick = async () => {
    setPayError('');
    setAuthorizing(true);

    try {
      await initiateRazorpayPayment({
        amount: breakdown.totalCharged,
        currency: 'INR',
        bookingDetails: {
          bayName: bay?.name,
          clientName,
          clientEmail,
        },
        onSuccess: (response) => {
          setAuthorizing(false);
          onConfirm && onConfirm(response);
        },
        onFailure: (err) => {
          setAuthorizing(false);
          setPayError(err.message || 'Razorpay checkout cancelled or failed');
        },
      });
    } catch (err) {
      setAuthorizing(false);
      setPayError(err.message);
    }
  };

  return (
    <Paper sx={{ p: 3, bgcolor: '#111827', border: '1px solid #1F2937', borderRadius: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Booking & Fee Breakdown
      </Typography>

      {payError && <Alert severity="error" sx={{ mb: 2 }}>{payError}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
          60-Min Bay Rental
        </Typography>
        <Typography variant="body2" sx={{ color: '#F9FAFB', fontWeight: 600 }}>
          {formatINR(breakdown.subtotal, { decimals: true })}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
          Trainer Platform Fee (10%)
        </Typography>
        <Typography variant="body2" sx={{ color: '#F9FAFB', fontWeight: 600 }}>
          {formatINR(breakdown.trainerFee, { decimals: true })}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="caption" sx={{ color: '#6B7280' }}>
          Includes Liability Insurance Verification & Access PIN
        </Typography>
        <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>
          Included
        </Typography>
      </Box>

      {/* Explicit Price Breakup Formula Banner */}
      <Box sx={{ p: 1.5, mb: 1, bgcolor: '#0B0F19', borderRadius: 2, border: '1px solid rgba(224, 254, 16, 0.25)' }}>
        <Typography variant="caption" sx={{ color: '#E0FE10', fontWeight: 700, display: 'block', mb: 0.25 }}>
          Price Breakup Formula:
        </Typography>
        <Typography variant="caption" sx={{ color: '#E5E7EB', display: 'block' }}>
          {formatINR(breakdown.subtotal, { decimals: true })} (Base Bay) + {formatINR(breakdown.trainerFee, { decimals: true })} (10% Platform Fee) = {formatINR(breakdown.totalCharged, { decimals: true })}
        </Typography>
      </Box>

      <Divider sx={{ my: 2, borderColor: '#374151' }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#F9FAFB' }}>
          Total Charged
        </Typography>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#E0FE10', fontFamily: "'Outfit', sans-serif" }}>
            {formatINR(breakdown.totalCharged, { decimals: true })}
          </Typography>
          <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
            INR via Razorpay Gateway
          </Typography>
        </Box>
      </Box>

      <Button
        variant="contained"
        color="primary"
        size="large"
        fullWidth
        onClick={handlePayClick}
        disabled={loading || authorizing || disabled}
        startIcon={<Zap size={18} />}
        sx={{ py: 1.5, fontSize: '1rem', fontWeight: 800 }}
      >
        {loading || authorizing ? 'Connecting Gateway...' : `Pay ${formatINR(breakdown.totalCharged, { decimals: true })} with Razorpay`}
      </Button>

      <Typography variant="caption" sx={{ color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 2 }}>
        <ShieldCheck size={14} color="#10B981" /> Razorpay Secured &bull; UPI, Cards, Netbanking supported
      </Typography>
    </Paper>
  );
}
