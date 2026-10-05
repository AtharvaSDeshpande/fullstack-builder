import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/auth/me?userId=...
router.get('/me', (req, res) => {
  try {
    const userId = req.query.userId || 'usr_marcus';
    const user = db.prepare(`SELECT id, name, email, role, phone, avatar_url, coi_status, coi_url FROM users WHERE id = ?`).get(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    return res.json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/trainer/coi (Submit or upload COI)
router.post('/trainer/coi', (req, res) => {
  try {
    const { trainerId, coiUrl, policyNumber, expirationDate } = req.body;
    if (!trainerId || !coiUrl) {
      return res.status(400).json({ success: false, error: 'Missing trainerId or coiUrl' });
    }

    db.prepare(`
      UPDATE users
      SET coi_status = 'pending', coi_url = ?
      WHERE id = ?
    `).run(coiUrl, trainerId);

    const updated = db.prepare(`SELECT id, name, email, coi_status, coi_url FROM users WHERE id = ?`).get(trainerId);

    return res.json({
      success: true,
      message: 'Certificate of Insurance submitted successfully for review',
      data: updated,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
