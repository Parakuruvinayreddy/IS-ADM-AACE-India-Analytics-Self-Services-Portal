const express = require('express');
const router = express.Router();
const db = require('../db');
const axios = require('axios');
const { nowIST } = require('../ist_time');
const { sendEmail } = require('../email');
const { encryptToken } = require('../crypto_utils');

let _intakeBaseUrl = null;
async function getIntakeBaseUrl() {
  if (_intakeBaseUrl) return _intakeBaseUrl;
  if (process.env.INTAKE_BASE_URL) {
    _intakeBaseUrl = process.env.INTAKE_BASE_URL.replace(/\/+$/, '');
    return _intakeBaseUrl;
  }
  _intakeBaseUrl = 'http://localhost:5175/intake';
  return _intakeBaseUrl;
}

async function writeAuditLog({ project_id, team_name, user_email, user_id, azure_oid, request_type, action, reason, status_before, status_after, version }) {
  try {
    const detailPayload = `Team: ${team_name} | Type: ${request_type} | Version: ${version} | Status: ${status_before} -> ${status_after} | Reason: ${reason}`;
    
    await db.query(`
      INSERT INTO audit_log (entity_id, entity_type, user_email, user_id, azure_oid, action, detail, timestamp)
      VALUES ($1, 'project', $2, $3, $4, $5, $6, $7)
    `, [project_id || null, user_email || 'admin', user_id || null, azure_oid || null, action || '', detailPayload, nowIST()]);
  } catch(e) {
    console.warn('[audit] write failed:', e.message);
  }
}

// ── GET /api/projects  →  all projects (newest first) ─────────────────────
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT project_id, team_name, team_lead, title, function, category, description,
             why_we_use_it, who_manages_it,
             fields_selected, contact_person, contact_email, alt_contact,
             escalation1_name, escalation1_email,
             escalation2_name, escalation2_email,
             dashboard_link, project_status, start_date, end_date,
             data_source, data_owner, data_validated_by,
             dashboard_developer, dashboard_owner, last_validated,
             milestones,
             status, version, submitted_at, updated_at
      FROM projects
    `;
    const params = [];
    if (status) {
      sql += ' WHERE status = $1';
      params.push(status);
    } else {
      sql += " WHERE status != 'pending_team_lead'";
    }
    sql += ' ORDER BY submitted_at DESC';
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('[projects] GET /:', err.message);
    res.status(500).json({ error: 'Failed to fetch projects', details: err.message });
  }
});

// ── GET /api/projects/:id  →  single project + its files ──────────────────
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid project id' });
    }
    const { rows: projectRows } = await db.query(`
      SELECT project_id, team_name, team_lead, title, function, category, description,
             why_we_use_it, who_manages_it,
             fields_selected, contact_person, contact_email, alt_contact,
             escalation1_name, escalation1_email,
             escalation2_name, escalation2_email,
             dashboard_link, project_status, start_date, end_date,
             data_source, data_owner, data_validated_by,
             dashboard_developer, dashboard_owner, last_validated,
             milestones,
             status, version, submitted_at, updated_at
      FROM projects
      WHERE project_id = $1
    `, [id]);

    if (!projectRows.length) return res.status(404).json({ error: 'Project not found' });

    const { rows: files } = await db.query(`
      SELECT file_id, file_type, file_name, file_path, uploaded_at
      FROM project_files
      WHERE project_id = $1
      ORDER BY uploaded_at ASC
    `, [id]);

    res.json({ ...projectRows[0], files });
  } catch (err) {
    console.error('[projects] GET /:id:', err.message);
    res.status(500).json({ error: 'Failed to fetch project', details: err.message });
  }
});

// ── PATCH /api/projects/:id/review  →  approve / reject / changes_requested
router.patch('/:id/review', async (req, res) => {
  const { status, comment } = req.body;
  const validStatuses = ['approved', 'rejected', 'changes_requested', 'under_review'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const id = parseInt(req.params.id);
    const { rows: currentRows } = await db.query('SELECT status, version, team_name, contact_email, title FROM projects WHERE project_id = $1', [id]);
    
    if (!currentRows.length) return res.status(404).json({ error: 'Project not found' });
    const current = currentRows[0];

    await db.query(`UPDATE projects SET status = $1, updated_at = $2 WHERE project_id = $3`, [status, nowIST(), id]);

    if (status === 'rejected') {
      const { rows: tokenRows } = await db.query(`
        SELECT access_token, user_email, ticket_id 
        FROM team_access 
        WHERE project_id = $1 
        ORDER BY granted_at DESC LIMIT 1
      `, [id]);
      
      if (tokenRows.length > 0) {
        const tokenRecord = tokenRows[0];
        
        // Compute new expires_at in IST (15 days from now)
        const duration_days = 15;
        const nowUtc = new Date();
        const istOffset = 330 * 60 * 1000;
        const nowIstMs = nowUtc.getTime() + istOffset;
        const expiresAtIstMs = nowIstMs + duration_days * 24 * 60 * 60 * 1000;
        const newExpiresAt = new Date(expiresAtIstMs).toISOString().replace('T', ' ').substring(0, 19);

        await db.query(`
          UPDATE team_access 
          SET status = 'active', expires_at = $1 
          WHERE access_token = $2
        `, [newExpiresAt, tokenRecord.access_token]);

        // Reactivate ticket if there is one
        if (tokenRecord.ticket_id) {
          await db.query(`
            UPDATE tickets 
            SET status = 'in_progress', updated_at = $1 
            WHERE ticket_id = $2
          `, [nowIST(), tokenRecord.ticket_id]);
        }

        // Generate the link
        const baseUrl = await getIntakeBaseUrl();
        const maskedToken = encryptToken(tokenRecord.access_token);
        const intake_url = `${baseUrl}/?token=${encodeURIComponent(maskedToken)}`;

        // Send email to team lead and team user who raised the request
        const emailSubject = `[ADM Analytics] Project Submission Rejected: ${current.title}`;
        const emailBody = `
          <p>Hello,</p>
          <p>Your project submission <strong>${current.title}</strong> has been reviewed and rejected by the administrator.</p>
          <p><strong>Reason / Comments for Rejection:</strong><br/>${comment || 'No comment provided.'}</p>
          <br/>
          <p>Your access link has been reactivated. Please use the link below to make the required corrections and resubmit the project:</p>
          <p><a href="${intake_url}">${intake_url}</a></p>
          <br/>
          <p>Regards,<br/>ADM Admin Team</p>
        `;

        if (current.contact_email) {
          sendEmail(current.contact_email, emailSubject, emailBody).catch(e => console.error('Email to team lead failed:', e.message));
        }
        if (tokenRecord.user_email && tokenRecord.user_email !== current.contact_email) {
          sendEmail(tokenRecord.user_email, emailSubject, emailBody).catch(e => console.error('Email to user failed:', e.message));
        }
      }
    }

    await writeAuditLog({
      project_id:    id,
      team_name:     current.team_name,
      user_email:    req.user.email,
      user_id:       req.user.oid,
      azure_oid:     req.user.oid,
      request_type:  'NEW',
      action:        'review_decision',
      reason:        comment || '',
      status_before: current.status,
      status_after:  status,
      version:       current.version,
    });

    res.json({ project_id: id, status, updated: true });
  } catch (err) {
    console.error('[projects] PATCH /:id/review:', err.message);
    res.status(500).json({ error: 'Failed to update review status', details: err.message });
  }
});

// ── POST /api/projects/:id/publish  →  publish project ────────────────────
router.post('/:id/publish', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { rows: projectRows } = await db.query(`
      SELECT p.project_id, p.team_name, p.title, p.function, p.category, p.description,
             p.status, p.version,
             (SELECT file_path FROM project_files WHERE project_id = p.project_id AND file_type = 'image' LIMIT 1) AS image_path
      FROM projects p
      WHERE p.project_id = $1
    `, [id]);

    if (!projectRows.length) return res.status(404).json({ error: 'Project not found' });
    const project = projectRows[0];
    const statusBefore = project.status;

    await db.query(`UPDATE projects SET status = 'published', updated_at = $1 WHERE project_id = $2`, [nowIST(), id]);

    // Use INSERT ... ON CONFLICT to handle re-publishing after unpublish
    await db.query(`
      INSERT INTO published_projects (project_id, published_at) VALUES ($1, $2)
      ON CONFLICT (project_id) DO UPDATE SET published_at = $2
    `, [id, nowIST()]);

    const { rows: pubRows } = await db.query('SELECT published_id, published_at FROM published_projects WHERE project_id = $1', [id]);
    const publishedRecord = pubRows[0];

    await writeAuditLog({
      project_id:    id,
      team_name:     project.team_name,
      user_email:    req.user.email,
      user_id:       req.user.oid,
      azure_oid:     req.user.oid,
      request_type:  'NEW',
      action:        'published',
      reason:        '',
      status_before: statusBefore,
      status_after:  'published',
      version:       project.version,
    });

    // Expire all active intake tokens for this project
    try {
      await db.query(`UPDATE team_access SET status = 'expired' WHERE project_id = $1 AND status = 'active'`, [id]);
    } catch (expErr) {
      console.warn('[projects] Could not expire tokens:', expErr.message);
    }

    try {
      await axios.post('http://localhost:3000/api/internal/refresh-published', {}, { timeout: 5000 });
    } catch (notifyErr) {
      console.warn('[projects] Could not notify main website backend:', notifyErr.message);
    }

    res.json({
      project_id: id,
      pub_id: publishedRecord.published_id,
      published_at: publishedRecord.published_at,
      status: 'published',
    });
  } catch (err) {
    console.error('[projects] POST /:id/publish:', err.message);
    res.status(500).json({ error: 'Failed to publish project', details: err.message });
  }
});

// ── POST /api/projects/:id/unpublish  →  unpublish project ────────────────
router.post('/:id/unpublish', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { rows: currentRows } = await db.query('SELECT status, version, team_name FROM projects WHERE project_id = $1', [id]);
    if (!currentRows.length) return res.status(404).json({ error: 'Project not found' });
    const current = currentRows[0];

    const statusBefore = current.status;

    // Set project back to submitted (pending review)
    await db.query(`UPDATE projects SET status = 'submitted', updated_at = $1 WHERE project_id = $2`, [nowIST(), id]);

    // Remove from published_projects so it can be re-published later
    await db.query(`DELETE FROM published_projects WHERE project_id = $1`, [id]);

    await writeAuditLog({
      project_id:    id,
      team_name:     current.team_name,
      user_email:    req.user.email,
      user_id:       req.user.oid,
      azure_oid:     req.user.oid,
      request_type:  'NEW',
      action:        'unpublished',
      reason:        'Unpublished by admin',
      status_before: statusBefore,
      status_after:  'submitted',
      version:       current.version,
    });

    try {
      await axios.post('http://localhost:3000/api/internal/refresh-published', {}, { timeout: 5000 });
    } catch (notifyErr) {
      console.warn('[projects] Could not notify main website backend:', notifyErr.message);
    }

    res.json({ project_id: id, status: 'submitted', unpublished: true });
  } catch (err) {
    console.error('[projects] POST /:id/unpublish:', err.message);
    res.status(500).json({ error: 'Failed to unpublish project', details: err.message });
  }
});

module.exports = router;
