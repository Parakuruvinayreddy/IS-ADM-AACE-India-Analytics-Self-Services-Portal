const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { nowIST } = require('../ist_time');
const { sendEmail } = require('../email');
const { encryptToken } = require('../crypto_utils');

// ── Intake Base URL Resolution ─────────────────────────────
// Priority: 1) INTAKE_BASE_URL env var  2) EC2 metadata  3) localhost
let _intakeBaseUrl = null;

async function getIntakeBaseUrl() {
  // Return cached value if already resolved
  if (_intakeBaseUrl) return _intakeBaseUrl;

  // 1) Environment variable (set by start_all.sh or .env)
  if (process.env.INTAKE_BASE_URL) {
    _intakeBaseUrl = process.env.INTAKE_BASE_URL.replace(/\/+$/, '');
    console.log(`[access] Intake URL from env: ${_intakeBaseUrl}`);
    return _intakeBaseUrl;
  }

  // 2) Auto-detect EC2 public IP via metadata service
  try {
    const http = require('http');
    const ip = await new Promise((resolve, reject) => {
      const req = http.get('http://169.254.169.254/latest/meta-data/public-ipv4', {
        timeout: 3000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data.trim()));
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });
    if (ip && /^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
      _intakeBaseUrl = `http://${ip}:5174/intake`;
      console.log(`[access] Intake URL from EC2 metadata: ${_intakeBaseUrl}`);
      return _intakeBaseUrl;
    }
  } catch (_) {
    // Not running on EC2 — that's fine, fall through
  }

  // 3) Fallback for local development — use Nginx proxy port with /intake path
  _intakeBaseUrl = 'http://localhost:5175/intake';
  console.log(`[access] Intake URL fallback: ${_intakeBaseUrl}`);
  return _intakeBaseUrl;
}

// Resolve on module load (non-blocking)
getIntakeBaseUrl().catch(() => {});

function normalizeTeamName(name) {
  if (!name) return '';
  let normalized = name.trim();
  normalized = normalized.replace(/\s+team$/i, '');
  return normalized.toUpperCase();
}

router.post('/grant', async (req, res) => {
  const { ticket_id, project_id, team_name, user_email, dl_email, duration_days, feedback_id, source, allowed_edits } = req.body;

  if (!team_name || !user_email || !duration_days) {
    return res.status(400).json({ error: 'team_name, user_email, and duration_days are required' });
  }
  if (!ticket_id && !project_id) {
    return res.status(400).json({ error: 'Either ticket_id or project_id is required' });
  }

  const normalizedTeam = normalizeTeamName(team_name);

  // Cap TTL to maximum 15 days
  const MAX_TTL_DAYS = 15;
  const cappedDuration = Math.min(parseInt(duration_days), MAX_TTL_DAYS);

  try {
    let existingTokenRow = null;
    const nowStr = nowIST();
    if (feedback_id) {
      const { rows } = await db.query(`
        SELECT access_id, access_token, expires_at 
        FROM team_access 
        WHERE feedback_id = $1 AND expires_at > $2 AND status = 'active'
        ORDER BY granted_at DESC LIMIT 1
      `, [parseInt(feedback_id), nowStr]);
      if (rows.length) existingTokenRow = rows[0];
    } else if (ticket_id) {
      const { rows } = await db.query(`
        SELECT access_id, access_token, expires_at 
        FROM team_access 
        WHERE ticket_id = $1 AND expires_at > $2 AND status = 'active'
        ORDER BY granted_at DESC LIMIT 1
      `, [parseInt(ticket_id), nowStr]);
      if (rows.length) existingTokenRow = rows[0];
    } else if (project_id) {
      const { rows } = await db.query(`
        SELECT access_id, access_token, expires_at 
        FROM team_access 
        WHERE project_id = $1 AND expires_at > $2 AND status = 'active'
        ORDER BY granted_at DESC LIMIT 1
      `, [parseInt(project_id), nowStr]);
      if (rows.length) existingTokenRow = rows[0];
    }

    if (existingTokenRow) {
      const baseUrl = await getIntakeBaseUrl();
      const maskedToken = encryptToken(existingTokenRow.access_token);
      const intake_url = `${baseUrl}/?token=${encodeURIComponent(maskedToken)}`;

      const isEdit = !!project_id;
      const subject = isEdit 
        ? `[ADM Analytics] Edit Access Granted for Team ${team_name}`
        : `[ADM Analytics] New Project Submission Access Granted for Team ${team_name}`;
      
      const formattedExpires = typeof existingTokenRow.expires_at === 'string'
        ? existingTokenRow.expires_at 
        : new Date(existingTokenRow.expires_at).toISOString().replace('T', ' ').substring(0, 19);

      const body = `
        <p>Hello,</p>
        <p>You have been granted access to ${isEdit ? 'edit your project details' : 'submit a new project'} on the ADM Intake Portal.</p>
        <p><strong>Team:</strong> ${team_name}</p>
        ${ticket_id ? `<p><strong>Reference Ticket:</strong> #${ticket_id}</p>` : ''}
        <p><strong>Duration:</strong> Valid (Expires ${formattedExpires} IST)</p>
        <br/>
        <p>Please click the secure link below to access the portal:</p>
        <p><a href="${intake_url}">${intake_url}</a></p>
        <br/>
        <p>Regards,<br/>ADM Admin Team</p>
      `;

      sendEmail(user_email, subject, body).catch(e => console.error('Email failed:', e));

      return res.status(200).json({
        team_name, user_email,
        expires_at:   formattedExpires,
        duration_days: cappedDuration,
        intake_url,
        access_id:    existingTokenRow.access_id,
      });
    }
  } catch (err) {
    console.error('[access] Check existing token failed:', err.message);
  }

  const access_token = uuidv4();
  // Compute expires_at in IST
  const nowUtc = new Date();
  const istOffset = 330 * 60 * 1000;
  const nowIstMs = nowUtc.getTime() + istOffset;
  const expiresAtIstMs = nowIstMs + cappedDuration * 24 * 60 * 60 * 1000;
  const expires_at = new Date(expiresAtIstMs).toISOString().replace('T', ' ').substring(0, 19);
  const grantedAt = nowIST();

  try {
    const { rows } = await db.query(`
      INSERT INTO team_access (ticket_id, team_name, user_email, access_token, granted_at, expires_at, project_id, dl_email, feedback_id, allowed_edits)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *
    `, [ticket_id ? parseInt(ticket_id) : null, normalizedTeam, user_email, access_token, grantedAt, expires_at, project_id ? parseInt(project_id) : null, dl_email || '', feedback_id ? parseInt(feedback_id) : null, allowed_edits || '']);

    const inserted = rows[0];

    if (ticket_id) {
      await db.query(`UPDATE tickets SET status = 'in_progress', updated_at = $1 WHERE ticket_id = $2`, [nowIST(), parseInt(ticket_id)]);
    }
    // If this grant came from a Required Changes entry, update its status to link_sent
    if (feedback_id) {
      try {
        await db.query(`UPDATE project_feedback SET status = 'link_sent' WHERE feedback_id = $1`, [parseInt(feedback_id)]);
      } catch(e) { console.warn('[access] feedback status update failed:', e.message); }
    }

    const baseUrl = await getIntakeBaseUrl();
    // Encrypt the token so the raw UUID is never exposed in URLs/emails
    const maskedToken = encryptToken(access_token);
    const intake_url = `${baseUrl}/?token=${encodeURIComponent(maskedToken)}`;

    // Trigger Email to User
    const isEdit = !!project_id;
    const subject = isEdit 
      ? `[ADM Analytics] Edit Access Granted for Team ${team_name}`
      : `[ADM Analytics] New Project Submission Access Granted for Team ${team_name}`;
    const body = `
      <p>Hello,</p>
      <p>You have been granted access to ${isEdit ? 'edit your project details' : 'submit a new project'} on the ADM Intake Portal.</p>
      <p><strong>Team:</strong> ${team_name}</p>
      ${ticket_id ? `<p><strong>Reference Ticket:</strong> #${ticket_id}</p>` : ''}
      <p><strong>Duration:</strong> Valid for ${duration_days} days (Expires ${expires_at} IST)</p>
      <br/>
      <p>Please click the secure link below to access the portal:</p>
      <p><a href="${intake_url}">${intake_url}</a></p>
      <br/>
      <p>Regards,<br/>ADM Admin Team</p>
    `;
    
    // Async fire-and-forget email
    sendEmail(user_email, subject, body).catch(e => console.error('Email failed:', e));

    res.status(201).json({
      team_name, user_email,
      expires_at:   expires_at,
      duration_days: cappedDuration,
      intake_url,
      access_id:    inserted.access_id,
    });
  } catch (err) {
    console.error('[access] POST /grant:', err.message);
    res.status(500).json({ error: 'Failed to grant access', details: err.message });
  }
});

router.get('/link', async (req, res) => {
  const { ticket_id, feedback_id } = req.query;
  if (!ticket_id && !feedback_id) {
    return res.status(400).json({ error: 'Either ticket_id or feedback_id is required' });
  }

  try {
    const nowStr = nowIST();
    let row = null;
    if (feedback_id) {
      const { rows } = await db.query(`
        SELECT access_token FROM team_access 
        WHERE feedback_id = $1 AND expires_at > $2 AND status = 'active'
        ORDER BY granted_at DESC LIMIT 1
      `, [parseInt(feedback_id), nowStr]);
      if (rows.length) row = rows[0];
    } else if (ticket_id) {
      const { rows } = await db.query(`
        SELECT access_token FROM team_access 
        WHERE ticket_id = $1 AND expires_at > $2 AND status = 'active'
        ORDER BY granted_at DESC LIMIT 1
      `, [parseInt(ticket_id), nowStr]);
      if (rows.length) row = rows[0];
    }

    if (!row) {
      return res.status(404).json({ error: 'No active access token found' });
    }

    const baseUrl = await getIntakeBaseUrl();
    const maskedToken = encryptToken(row.access_token);
    const intake_url = `${baseUrl}/?token=${encodeURIComponent(maskedToken)}`;
    res.json({ intake_url });
  } catch (err) {
    console.error('[access] GET /link:', err.message);
    res.status(500).json({ error: 'Failed to retrieve access link', details: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT ta.access_id, ta.ticket_id, ta.team_name, ta.user_email,
             ta.access_token, ta.granted_at, ta.expires_at, ta.status,
             t.title AS ticket_title
      FROM team_access ta
      LEFT JOIN tickets t ON ta.ticket_id = t.ticket_id
      ORDER BY ta.granted_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error('[access] GET /:', err.message);
    res.status(500).json({ error: 'Failed to fetch access records', details: err.message });
  }
});

router.get('/:token', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT access_id, ticket_id, team_name, user_email,
             access_token, granted_at, expires_at, status
      FROM team_access
      WHERE access_token = $1
    `, [req.params.token]);

    if (!rows.length) return res.json({ valid: false, reason: 'Token not found' });
    const record = rows[0];

    const now = new Date();
    const expiresAt = new Date(record.expires_at);

    if (record.status !== 'active') {
      return res.json({ valid: false, reason: 'Token has been revoked' });
    }

    if (expiresAt < now) {
      await db.query(`UPDATE team_access SET status = 'expired' WHERE access_token = $1`, [req.params.token]);
      return res.json({ valid: false, reason: 'Token expired' });
    }

    const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

    res.json({
      valid: true,
      team_name:    record.team_name,
      user_email:   record.user_email,
      expires_at:   expiresAt.toISOString(),
      days_remaining: daysRemaining,
    });
  } catch (err) {
    console.error('[access] GET /:token:', err.message);
    res.status(500).json({ error: 'Failed to verify token', details: err.message });
  }
});

module.exports = router;
