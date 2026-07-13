const express = require('express');
const router = express.Router();
const db = require('../db');

// ── GET /api/audit  →  full audit log (newest first) ──────────────────────
// Optional query params: ?entity_type=ticket|project|feedback|access&limit=100
router.get('/', async (req, res) => {
  const { entity_type, limit = 200 } = req.query;
  try {
    let query = `
      SELECT log_id, entity_type, entity_id, user_email,
             action, detail, timestamp
      FROM audit_log
    `;
    const params = [];
    let paramIdx = 1;
    
    if (entity_type) {
      query += ` WHERE entity_type = $${paramIdx++}`;
      params.push(entity_type);
    }
    
    query += ` ORDER BY timestamp DESC LIMIT $${paramIdx}`;
    params.push(parseInt(limit));

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('[audit] GET /:', err.message);
    res.status(500).json({ error: 'Failed to fetch audit log', details: err.message });
  }
});

module.exports = router;
