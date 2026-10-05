import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/host/dashboard?hostId=...
router.get('/dashboard', (req, res) => {
  try {
    const hostId = req.query.hostId || 'usr_elena';

    // Get host gyms
    const gyms = db.prepare(`SELECT * FROM gyms WHERE host_id = ?`).all(hostId);
    const gymIds = gyms.map(g => g.id);

    if (gymIds.length === 0) {
      return res.json({
        success: true,
        data: {
          gyms: [],
          bookings: [],
          ledger: { grossEarnings: 0, platformFees: 0, netPayout: 0, totalHoursBooked: 0 },
        },
      });
    }

    const placeholders = gymIds.map(() => '?').join(',');

    // Get bookings across host's gyms
    const bookings = db.prepare(`
      SELECT bk.*, s.date, s.start_time, s.end_time, s.buffer_end_time,
             b.name AS bay_name, b.category AS bay_category,
             g.name AS gym_name, u.name AS trainer_name, u.phone AS trainer_phone
      FROM bookings bk
      JOIN slots s ON bk.slot_id = s.id
      JOIN bays b ON s.bay_id = b.id
      JOIN gyms g ON b.gym_id = g.id
      JOIN users u ON bk.trainer_id = u.id
      WHERE g.id IN (${placeholders})
      ORDER BY s.date ASC, s.start_time ASC
    `).all(...gymIds);

    // Compute ledger earnings
    const grossEarnings = bookings.reduce((sum, b) => sum + (b.amount_subtotal || 0), 0);
    const platformFees = bookings.reduce((sum, b) => sum + (b.host_fee || 0), 0);
    const netPayout = +(grossEarnings - platformFees).toFixed(2);

    return res.json({
      success: true,
      data: {
        gyms,
        bookings,
        ledger: {
          grossEarnings: +grossEarnings.toFixed(2),
          platformFees: +platformFees.toFixed(2),
          netPayout,
          totalHoursBooked: bookings.length,
          currency: 'INR',
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/host/incidents (Report overstay or equipment damage)
router.post('/incidents', (req, res) => {
  try {
    const { bookingId, reporterId, reason } = req.body;
    if (!bookingId || !reporterId || !reason) {
      return res.status(400).json({ success: false, error: 'Missing incident report details' });
    }

    const id = `inc_${Date.now().toString().slice(-6)}`;
    db.prepare(`
      INSERT INTO incidents (id, booking_id, reporter_id, reason, status)
      VALUES (?, ?, ?, ?, 'open')
    `).run(id, bookingId, reporterId, reason);

    return res.status(201).json({
      success: true,
      data: { id, bookingId, reason, status: 'open' },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
