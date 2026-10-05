import { Router } from 'express';
import db from '../db/database.js';

const router = Router();

// GET /api/bays (with search, category, city filtering)
router.get('/', (req, res) => {
  try {
    const { category, search, city, maxRate } = req.query;

    let query = `
      SELECT b.*, g.name AS gym_name, g.address AS gym_address, g.city AS gym_city, g.state AS gym_state,
             g.lat AS gym_lat, g.lng AS gym_lng, g.lat, g.lng,
             g.photos AS gym_photos, g.amenities AS gym_amenities, g.rules AS gym_rules, g.access_instructions AS gym_access
      FROM bays b
      JOIN gyms g ON b.gym_id = g.id
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'All') {
      query += ` AND b.category = ?`;
      params.push(category);
    }
    if (city && city !== 'All') {
      query += ` AND (g.city = ? OR g.address LIKE ? OR g.name LIKE ?)`;
      params.push(city, `%${city}%`, `%${city}%`);
    }
    if (maxRate) {
      query += ` AND b.hourly_rate <= ?`;
      params.push(Number(maxRate));
    }
    if (search) {
      query += ` AND (b.name LIKE ? OR g.name LIKE ? OR b.equipment_tags LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY b.hourly_rate ASC`;

    const bays = db.prepare(query).all(...params);

    const formatted = bays.map(b => ({
      ...b,
      equipment_tags: JSON.parse(b.equipment_tags || '[]'),
      gym_photos: JSON.parse(b.gym_photos || '[]'),
      gym_amenities: JSON.parse(b.gym_amenities || '[]'),
      gym_rules: JSON.parse(b.gym_rules || '[]'),
    }));

    return res.json({ success: true, data: formatted });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/bays/slot/:slotId (Get bay and slot details by slotId)
router.get('/slot/:slotId', (req, res) => {
  try {
    const slot = db.prepare(`
      SELECT s.*, b.id AS bay_id, b.name AS bay_name, b.category AS bay_category,
             b.hourly_rate, b.equipment_tags, b.offpeak_start, b.offpeak_end,
             g.id AS gym_id, g.name AS gym_name, g.address AS gym_address,
             g.city AS gym_city, g.state AS gym_state, g.photos AS gym_photos,
             g.access_instructions AS gym_access
      FROM slots s
      JOIN bays b ON s.bay_id = b.id
      JOIN gyms g ON b.gym_id = g.id
      WHERE s.id = ?
    `).get(req.params.slotId);

    if (!slot) {
      return res.status(404).json({ success: false, error: 'Slot not found' });
    }

    return res.json({
      success: true,
      data: {
        slot: {
          id: slot.id,
          bay_id: slot.bay_id,
          date: slot.date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          buffer_end_time: slot.buffer_end_time,
          status: slot.status,
        },
        bay: {
          id: slot.bay_id,
          name: slot.bay_name,
          category: slot.bay_category,
          hourly_rate: slot.hourly_rate,
          equipment_tags: JSON.parse(slot.equipment_tags || '[]'),
          offpeak_start: slot.offpeak_start,
          offpeak_end: slot.offpeak_end,
          gym_id: slot.gym_id,
          gym_name: slot.gym_name,
          gym_address: slot.gym_address,
          gym_city: slot.gym_city,
          gym_photos: JSON.parse(slot.gym_photos || '[]'),
          gym_access: slot.gym_access,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/bays/:id (Bay details with upcoming slots)
router.get('/:id', (req, res) => {
  try {
    const bay = db.prepare(`
      SELECT b.*, g.name AS gym_name, g.address AS gym_address, g.city AS gym_city, g.state AS gym_state,
             g.lat AS gym_lat, g.lng AS gym_lng, g.lat, g.lng,
             g.photos AS gym_photos, g.amenities AS gym_amenities, g.rules AS gym_rules, g.access_instructions AS gym_access
      FROM bays b
      JOIN gyms g ON b.gym_id = g.id
      WHERE b.id = ?
    `).get(req.params.id);

    if (!bay) {
      return res.status(404).json({ success: false, error: 'Bay not found' });
    }

    const slots = db.prepare(`
      SELECT * FROM slots
      WHERE bay_id = ?
      ORDER BY date ASC, start_time ASC
    `).all(req.params.id);

    return res.json({
      success: true,
      data: {
        ...bay,
        equipment_tags: JSON.parse(bay.equipment_tags || '[]'),
        gym_photos: JSON.parse(bay.gym_photos || '[]'),
        gym_amenities: JSON.parse(bay.gym_amenities || '[]'),
        gym_rules: JSON.parse(bay.gym_rules || '[]'),
        slots,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
