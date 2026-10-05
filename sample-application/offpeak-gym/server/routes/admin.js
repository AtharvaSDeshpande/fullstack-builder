import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/admin/coi-queue (Pending trainer COI submissions)
router.get('/coi-queue', (req, res) => {
  try {
    const trainers = db.prepare(`
      SELECT id, name, email, phone, coi_status, coi_url, created_at
      FROM users
      WHERE role = 'trainer'
      ORDER BY CASE WHEN coi_status = 'pending' THEN 0 ELSE 1 END, created_at DESC
    `).all();

    return res.json({ success: true, data: trainers });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/coi/:userId (Approve or reject insurance)
router.patch('/coi/:userId', (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    db.prepare(`UPDATE users SET coi_status = ? WHERE id = ?`).run(status, req.params.userId);

    const updated = db.prepare(`SELECT id, name, email, coi_status, coi_url FROM users WHERE id = ?`).get(req.params.userId);

    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/incidents
router.get('/incidents', (req, res) => {
  try {
    const incidents = db.prepare(`
      SELECT inc.*, bk.slot_id, bk.trainer_id, u.name AS reporter_name
      FROM incidents inc
      JOIN bookings bk ON inc.booking_id = bk.id
      JOIN users u ON inc.reporter_id = u.id
      ORDER BY inc.created_at DESC
    `).all();

    return res.json({ success: true, data: incidents });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
