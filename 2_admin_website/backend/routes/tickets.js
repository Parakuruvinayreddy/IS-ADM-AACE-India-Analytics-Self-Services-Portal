const express = require('express');
const router = express.Router();
const db = require('../db');
const { nowIST } = require('../ist_time');

const ADMIN = 'admin';

async function writeAudit(entity_type, entity_id, action, detail, req) {
  try {
    const userEmail = req && req.user ? req.user.email : 'admin';
    const userId = req && req.user ? req.user.oid : null;
    const azureOid = req && req.user ? req.user.oid : null;

    await db.query(`
      INSERT INTO audit_log (entity_type, entity_id, user_email, user_id, azure_oid, action, detail, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [entity_type, entity_id || null, userEmail, userId, azureOid, action, detail || '', nowIST()]);
  } catch (e) {
    console.warn('[audit] write failed:', e.message);
  }
}

router.get('/', async (req, res) => {
  try {
    const teamFilter = req.query.team_name;
    const nowStr = nowIST();
    let sql = `
      SELECT t.ticket_id, t.team_name, t.title, t.description,
             t.contact_person, t.contact_email,
             t.type, t.status, t.notes, t.created_at, t.updated_at,
             EXISTS(
               SELECT 1 FROM team_access ta
               WHERE ta.ticket_id = t.ticket_id
                 AND ta.expires_at > $1
                 AND ta.status = 'active'
             ) AS has_active_token
      FROM tickets t
      WHERE t.type = 'query'
    `;
    const params = [nowStr];
    let paramIdx = 2;
    if (teamFilter) {
      sql += ` AND t.team_name = $${paramIdx++}`;
      params.push(teamFilter);
    }
    sql += ` ORDER BY t.created_at DESC`;
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('[tickets] GET /:', err.message);
    res.status(500).json({ error: 'Failed to fetch tickets', details: err.message });
  }
});

router.get('/suggestions', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT ticket_id, team_name, title, description,
             contact_person, contact_email,
             type, status, notes, created_at, updated_at
      FROM tickets
      WHERE type IN ('suggestion', 'feedback')
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('[tickets] GET /suggestions:', err.message);
    res.status(500).json({ error: 'Failed to fetch suggestions', details: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT ticket_id, team_name, title, description,
             contact_person, contact_email,
             type, status, notes, created_at, updated_at
      FROM tickets WHERE ticket_id = $1
    `, [parseInt(req.params.id)]);
    if (!rows.length) return res.status(404).json({ error: 'Ticket not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ticket', details: err.message });
  }
});

router.post('/', async (req, res) => {
  const { team_name, title, description, contact_person, contact_email, alt_contact, type } = req.body;
  if (!team_name) return res.status(400).json({ error: 'team_name is required' });

  try {
    const istNow = nowIST();
    const { rows } = await db.query(`
      INSERT INTO tickets (team_name, title, description, contact_person, contact_email, type, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, [team_name, title || '', description || '', contact_person || '', contact_email || '', type || 'query', istNow, istNow]);

    const inserted = rows[0];

    await writeAudit('ticket', inserted.ticket_id, `ticket_created_${type || 'query'}`, `${team_name} submitted a ${type || 'query'}: ${title}`, req);

    res.status(201).json(inserted);
  } catch (err) {
    console.error('[tickets] POST /:', err.message);
    res.status(500).json({ error: 'Failed to create ticket', details: err.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'in_progress', 'done', 'reviewed', 'resolved', 'deleted'];
  if (!status || !valid.includes(status))
    return res.status(400).json({ error: `status must be one of: ${valid.join(', ')}` });

  try {
    const id = parseInt(req.params.id);
    const { rows: beforeRows } = await db.query('SELECT status, type, team_name FROM tickets WHERE ticket_id = $1', [id]);
    if (!beforeRows.length) return res.status(404).json({ error: 'Not found' });
    const before = beforeRows[0];

    await db.query(`UPDATE tickets SET status = $1, updated_at = $2 WHERE ticket_id = $3`, [status, nowIST(), id]);

    await writeAudit('ticket', id, 'status_changed', `Status: ${before.status} → ${status}`, req);

    res.json({ ticket_id: id, status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status', details: err.message });
  }
});

router.patch('/:id/notes', async (req, res) => {
  const { notes } = req.body;
  try {
    const id = parseInt(req.params.id);
    await db.query(`UPDATE tickets SET notes = $1, updated_at = $2 WHERE ticket_id = $3`, [notes || '', nowIST(), id]);

    await writeAudit('ticket', id, 'note_saved', 'Admin updated internal note.', req);

    res.json({ ticket_id: id, notes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save note', details: err.message });
  }
});

router.patch('/:id/transfer', async (req, res) => {
  const { category, subCategory } = req.body;
  if (!category) return res.status(400).json({ error: 'Category is required' });

  try {
    const id = parseInt(req.params.id);
    const { rows } = await db.query('SELECT description, team_name, title FROM tickets WHERE ticket_id = $1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Ticket not found' });

    const ticket = rows[0];
    const desc = ticket.description || '';

    // Parse description header if it exists
    let cleanDescription = desc;
    let existingImpact = '';
    let existingProject = '';
    let existingChanges = '';

    const bracketMatch = desc.match(/^\[(Category:[^\]]+)\]\s*(.*)$/);
    if (bracketMatch) {
      const metaString = bracketMatch[1];
      cleanDescription = bracketMatch[2];

      const parts = metaString.split('|');
      parts.forEach(part => {
        const colonIndex = part.indexOf(':');
        if (colonIndex !== -1) {
          const key = part.substring(0, colonIndex).trim().toLowerCase();
          const val = part.substring(colonIndex + 1).trim();

          if (key === 'impact') {
            existingImpact = val;
          } else if (key === 'project') {
            existingProject = val;
          } else if (key === 'changes requested') {
            existingChanges = val;
          }
        }
      });
    }

    // Reconstruct description with new category/subcategory
    const newParts = [`Category: ${category}`];
    if (subCategory) {
      newParts.push(`Sub-category: ${subCategory}`);
    }
    if (existingImpact) {
      newParts.push(`Impact: ${existingImpact}`);
    }
    if (existingProject) {
      newParts.push(`Project: ${existingProject}`);
    }
    if (existingChanges) {
      newParts.push(`Changes Requested: ${existingChanges}`);
    }

    const newDescription = `[${newParts.join(' | ')}] ${cleanDescription}`;

    await db.query(`UPDATE tickets SET description = $1, updated_at = $2 WHERE ticket_id = $3`, [newDescription, nowIST(), id]);

    await writeAudit('ticket', id, 'ticket_transferred', `Transferred to Category: ${category}${subCategory ? ` | Sub-category: ${subCategory}` : ''}`, req);

    res.json({ ticket_id: id, description: newDescription });
  } catch (err) {
    console.error('[tickets] PATCH /:id/transfer:', err.message);
    res.status(500).json({ error: 'Failed to transfer ticket', details: err.message });
  }
});

module.exports = router;
