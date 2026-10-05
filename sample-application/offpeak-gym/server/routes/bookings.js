import { Router } from 'express';
import db from '../db/database.js';
import { sendAccessPinSms } from '../middleware/twilio.js';

const router = Router();

// POST /api/bookings (Create booking & process checkout)
router.post('/', (req, res) => {
  try {
    const { slotId, trainerId, clientName, clientEmail, waiverSigned } = req.body;

    if (!slotId || !trainerId || !clientName || !clientEmail) {
      return res.status(400).json({ success: false, error: 'Missing required booking fields' });
    }

    // Verify slot availability
    const slot = db.prepare(`
      SELECT s.*, b.hourly_rate, b.name AS bay_name, g.id AS gym_id, g.host_id, g.name AS gym_name, g.access_instructions
      FROM slots s
      JOIN bays b ON s.bay_id = b.id
      JOIN gyms g ON b.gym_id = g.id
      WHERE s.id = ?
    `).get(slotId);

    if (!slot) {
      return res.status(404).json({ success: false, error: 'Slot not found' });
    }

    if (slot.status !== 'available') {
      return res.status(400).json({ success: false, error: 'This time slot is no longer available' });
    }

    // Fee calculations
    const subtotal = slot.hourly_rate;
    const trainerFee = +(subtotal * 0.10).toFixed(2); // 10% trainer surcharge
    const hostFee = +(subtotal * 0.05).toFixed(2);    // 5% host platform fee
    const totalCharged = +(subtotal + trainerFee).toFixed(2);

    // Generate 4-digit numeric access PIN
    const accessPin = String(Math.floor(1000 + Math.random() * 9000));
    const bookingId = `bkg_${Date.now().toString().slice(-6)}`;

    const insert = db.transaction(() => {
      // Mark slot booked
      db.prepare(`UPDATE slots SET status = 'booked' WHERE id = ?`).run(slotId);

      // Insert booking
      db.prepare(`
        INSERT INTO bookings (
          id, slot_id, trainer_id, host_id, client_name, client_email,
          waiver_signed, amount_subtotal, trainer_fee, host_fee, total_charged,
          access_pin, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
      `).run(
        bookingId, slotId, trainerId, slot.host_id, clientName, clientEmail,
        waiverSigned ? 1 : 0, subtotal, trainerFee, hostFee, totalCharged,
        accessPin
      );
    });

    insert();

    // Dispatch SMS notification with access PIN
    const trainer = db.prepare(`SELECT phone FROM users WHERE id = ?`).get(trainerId);
    const trainerPhone = trainer?.phone || req.body.phone || '+91 98900 29809';

    sendAccessPinSms({
      phone: trainerPhone,
      gymName: slot.gym_name,
      accessPin,
      sessionTime: `${slot.start_time} - ${slot.end_time}`,
      date: slot.date,
    }).catch(err => console.warn('SMS dispatch failed:', err.message));

    return res.status(201).json({
      success: true,
      data: {
        bookingId,
        slotId,
        bayName: slot.bay_name,
        gymName: slot.gym_name,
        date: slot.date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        accessPin,
        accessInstructions: slot.access_instructions,
        amountSubtotal: subtotal,
        trainerFee,
        totalCharged,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/trainer/bookings?trainerId=...
router.get('/trainer', (req, res) => {
  try {
    const trainerId = req.query.trainerId || 'usr_marcus';

    const bookings = db.prepare(`
      SELECT bk.*, s.date, s.start_time, s.end_time, s.buffer_end_time,
             b.name AS bay_name, b.category AS bay_category,
             g.name AS gym_name, g.address AS gym_address, g.city AS gym_city,
             g.access_instructions
      FROM bookings bk
      JOIN slots s ON bk.slot_id = s.id
      JOIN bays b ON s.bay_id = b.id
      JOIN gyms g ON b.gym_id = g.id
      WHERE bk.trainer_id = ?
      ORDER BY s.date DESC, s.start_time DESC
    `).all(trainerId);

    return res.json({ success: true, data: bookings });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/bookings/:id (Get single booking details by booking ID)
router.get('/:id', (req, res) => {
  try {
    const booking = db.prepare(`
      SELECT bk.*, s.date, s.start_time, s.end_time, s.buffer_end_time,
             b.name AS bay_name, b.category AS bay_category, b.hourly_rate,
             g.name AS gym_name, g.address AS gym_address, g.city AS gym_city,
             g.access_instructions, u.name AS trainer_name, u.phone AS trainer_phone
      FROM bookings bk
      JOIN slots s ON bk.slot_id = s.id
      JOIN bays b ON s.bay_id = b.id
      JOIN gyms g ON b.gym_id = g.id
      JOIN users u ON bk.trainer_id = u.id
      WHERE bk.id = ?
    `).get(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    return res.json({ success: true, data: booking });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
