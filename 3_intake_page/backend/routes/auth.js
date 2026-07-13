const express = require('express');
const db = require('../db');
const { nowIST } = require('../ist_time');
const { resolveToken } = require('../crypto_utils');

const router = express.Router();

// ════════════════════════════════════════════════════════════
//  GET /api/auth/verify?token=xxx
//  Exact same logic as the FastAPI version — validates a
//  team_access token, checks expiry, determines mode.
// ════════════════════════════════════════════════════════════

router.get('/verify', async (req, res) => {
  try {
    const rawToken = req.query.token;
    if (!rawToken) {
      return res.json({ valid: false, reason: 'No token provided' });
    }

    // Decrypt encrypted token or fall back to raw UUID
    const token = resolveToken(rawToken);

    const { rows } = await db.query('SELECT * FROM team_access WHERE access_token = $1', [token]);
    const record = rows[0];

    if (!record) {
      return res.json({ valid: false, reason: 'Token not found' });
    }

    if (record.status !== 'active') {
      return res.json({ valid: false, reason: 'Token has been revoked' });
    }

    // Compare using IST (UTC+5:30)
    const IST_OFFSET = 330 * 60 * 1000; // 5h30m in ms
    const now = new Date(Date.now() + IST_OFFSET);

    let expires;
    const expiresRaw = record.expires_at;

    if (expiresRaw instanceof Date) {
      expires = expiresRaw;
    } else {
      let expiresStr = String(expiresRaw);
      expiresStr = expiresStr.includes('Z') ? expiresStr.replace('Z', '+00:00') : expiresStr;
      try {
        expires = new Date(expiresStr);
      } catch (_) {
        // Fallback: treat as IST
        expires = new Date(expiresStr);
      }
    }

    // If no timezone info, assume IST
    // JavaScript Date always stores UTC internally, so we offset if needed
    if (isNaN(expires.getTime())) {
      return res.json({ valid: false, reason: 'Invalid expiry date' });
    }

    // Compare timestamps
    if (expires < now) {
      await db.query("UPDATE team_access SET status = 'expired' WHERE access_token = $1", [token]);
      return res.json({ valid: false, reason: 'Token expired' });
    }

    const daysRemaining = Math.floor((expires - now) / (1000 * 60 * 60 * 24));

    const projectIdVal = record.project_id || null;
    const feedbackIdVal = record.feedback_id || null;
    const ticketIdVal = record.ticket_id || null;

    // Fetch project status & title if a project is linked
    let projectStatusVal = null;
    let projectTitleVal = null;
    let adminCommentVal = null;

    if (projectIdVal) {
      const projResult = await db.query(
        'SELECT status, title FROM projects WHERE project_id = $1',
        [projectIdVal]
      );
      const projRow = projResult.rows[0];
      if (projRow) {
        projectStatusVal = projRow.status;
        projectTitleVal = projRow.title;

        // If changes were requested, fetch the latest admin comment
        if (projectStatusVal === 'changes_requested') {
          const commentResult = await db.query(
            `SELECT detail FROM audit_log
             WHERE entity_id = $1 AND entity_type = 'project' AND action = 'review_decision'
             ORDER BY timestamp DESC LIMIT 1`,
            [String(projectIdVal)]
          );
          const commentRow = commentResult.rows[0];
          if (commentRow) {
            const detail = commentRow.detail || '';
            const reasonParts = detail.split('Reason: ');
            if (reasonParts.length > 1) {
              adminCommentVal = reasonParts[reasonParts.length - 1].trim();
            }
          }
        }
      }
    }

    // Mode logic:
    //   team_lead = project has status 'pending_team_lead'
    //   edit      = has project_id AND (has feedback_id OR has ticket_id)
    //   submitted = has project_id but not pending team lead review and no edit keys
    //   new       = no project_id at all
    let modeVal;
    if (projectIdVal && projectStatusVal === 'pending_team_lead') {
      modeVal = 'team_lead';
    } else if (projectIdVal && (feedbackIdVal || ticketIdVal)) {
      modeVal = 'edit';
    } else if (projectIdVal) {
      modeVal = 'submitted';
    } else {
      modeVal = 'new';
    }

    return res.json({
      valid: true,
      team_name: record.team_name,
      user_email: record.user_email,
      expires_at: expires.toISOString(),
      days_remaining: daysRemaining,
      project_id: projectIdVal,
      feedback_id: feedbackIdVal,
      ticket_id: ticketIdVal,
      mode: modeVal,
      project_status: projectStatusVal,
      project_title: projectTitleVal,
      admin_comment: adminCommentVal,
      allowed_edits: record.allowed_edits || '',
    });
  } catch (err) {
    console.error('[AUTH] Token verify error:', err.message);
    return res.status(500).json({ valid: false, reason: 'Server error' });
  }
});

module.exports = router;
