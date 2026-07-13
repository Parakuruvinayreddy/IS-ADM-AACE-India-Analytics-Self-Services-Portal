const express = require('express');
const router = express.Router();
const db = require('../db');
const { nowIST } = require('../ist_time');
const { sendEmail } = require('../email');

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
    const { team_name, type } = req.query;
    const nowStr = nowIST();
    let sql = `
      SELECT f.feedback_id, f.project_id, f.project_name,
             f.user_name, f.user_email, f.user_role,
             f.rating, f.comment, f.status, f.admin_note, f.submitted_at,
             f.type, f.issue_title, f.change_type, f.project_title, f.team_name,
             (SELECT detail FROM audit_log a 
              WHERE a.entity_id = f.project_id AND a.action = 'edit_resubmitted' 
              ORDER BY a.timestamp DESC LIMIT 1) as latest_changes,
             EXISTS(
               SELECT 1 FROM team_access ta 
               WHERE ta.feedback_id = f.feedback_id 
                 AND ta.expires_at > $1
                 AND ta.status = 'active'
             ) AS has_active_token
      FROM project_feedback f
      WHERE 1=1
    `;
    const params = [nowStr];
    let paramIdx = 2;
    if (team_name) {
      sql += ` AND UPPER(f.team_name) = UPPER($${paramIdx++})`;
      params.push(team_name);
    }
    if (type) {
      sql += ` AND f.type = $${paramIdx++}`;
      params.push(type);
    }
    sql += ` ORDER BY f.submitted_at DESC`;
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('[feedback] GET /:', err.message);
    res.status(500).json({ error: 'Failed to fetch feedback', details: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { project_id, project_title, project_name, team_name, user_name, user_email, user_role, rating, comment, description, type, issue_title, change_type, contact_email } = req.body;
    const pName = project_title || project_name || '';
    const pComment = comment || description || '';

    const { rows } = await db.query(`
      INSERT INTO project_feedback
        (project_id, project_name, user_name, user_email, user_role, rating, comment, submitted_at, type, issue_title, change_type, project_title, team_name, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending') RETURNING *
    `, [
      project_id || null, pName, user_name || 'Anonymous', 
      user_email || '', user_role || '', rating || null, 
      pComment, nowIST(),
      type || 'feedback',
      issue_title || '',
      change_type || '',
      project_title || '',
      team_name || ''
    ]);

    const inserted = rows[0];

    await writeAudit('feedback', inserted.feedback_id, 'feedback_submitted', 
      `${user_name || 'Anonymous'} submitted ${type === 'required_changes' ? 'Required Changes' : type === 'website_feedback' ? 'Website Feedback' : 'Project Feedback'} on "${pName}"`, req);

    // Email routing based on feedback type
    if (type === 'required_changes') {
      // Required Changes → Admin DL
      const subject = `[ADM Required Changes] New Issue Logged for ${pName}`;
      const body = `
        <p>A new "Required Changes" request has been submitted.</p>
        <p><strong>Project:</strong> ${pName} (${team_name})</p>
        <p><strong>Submitted By:</strong> ${user_name} (${user_email})</p>
        <p><strong>Issue Type:</strong> ${issue_title}</p>
        <p><strong>Description:</strong><br/>${pComment}</p>
        <p>Please review this request in the ADM Admin Dashboard under Teams -> ${team_name} -> Required Changes.</p>
      `;
      sendEmail('admin_dl@te.com', subject, body).catch(e => console.error('Email failed:', e));
    } else if (type === 'website_feedback') {
      // Website Feedback → Admin DL
      const stars = '★'.repeat(rating || 0) + '☆'.repeat(5 - (rating || 0));
      const subject = `[ADM Website Feedback] ${stars} from ${user_name || 'Anonymous'}`;
      const body = `
        <p>New website feedback has been submitted.</p>
        <p><strong>Rating:</strong> ${rating}/5 ${stars}</p>
        <p><strong>Submitted By:</strong> ${user_name || 'Anonymous'} (${user_email || 'N/A'})</p>
        <p><strong>Comments:</strong><br/>${pComment || 'No comments'}</p>
      `;
      sendEmail('admin_dl@te.com', subject, body).catch(e => console.error('Email failed:', e));
    } else if (type === 'feedback' || !type) {
      // Per-project Feedback → Team Contact Email
      const targetEmail = contact_email || '';
      if (targetEmail) {
        const stars = '★'.repeat(rating || 0) + '☆'.repeat(5 - (rating || 0));
        const subject = `[ADM Dashboard Feedback] ${stars} for ${pName}`;
        const body = `
          <p>You received new feedback for your project dashboard.</p>
          <p><strong>Project:</strong> ${pName}</p>
          <p><strong>Rating:</strong> ${rating}/5 ${stars}</p>
          <p><strong>Submitted By:</strong> ${user_name || 'Anonymous'} (${user_email || 'N/A'})</p>
          <p><strong>Role:</strong> ${user_role || 'N/A'}</p>
          <p><strong>Comments:</strong><br/>${pComment || 'No comments'}</p>
          <p style="color:#94a3b8;font-size:12px;">This feedback was submitted from the ADM Analytics project page.</p>
        `;
        sendEmail(targetEmail, subject, body).catch(e => console.error('Email failed:', e));
      } else {
        console.warn('[feedback] No contact_email for project feedback, skipping email.');
      }
    }

    res.status(201).json(inserted);
  } catch (err) {
    console.error('[feedback] POST /:', err.message);
    res.status(500).json({ error: 'Failed to create feedback', details: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  const { status, admin_note } = req.body;
  const valid = ['unread', 'read', 'flagged', 'approved', 'link_sent', 'resubmitted', 'deleted'];
  if (status && !valid.includes(status))
    return res.status(400).json({ error: `status must be one of: ${valid.join(', ')}` });

  try {
    const id = parseInt(req.params.id);

    if (status === 'deleted') {
      const { rows: currentRows } = await db.query('SELECT status FROM project_feedback WHERE feedback_id = $1', [id]);
      if (!currentRows.length) return res.status(404).json({ error: 'Feedback not found' });
      const currentStatus = currentRows[0].status;
      if (['approved', 'link_sent', 'resubmitted'].includes(currentStatus)) {
        return res.status(400).json({ error: 'Approved tickets cannot be deleted' });
      }
    }

    let updates = [];
    let params = [];
    let paramIdx = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramIdx++}`);
      params.push(status);
    }
    if (admin_note !== undefined) {
      updates.push(`admin_note = $${paramIdx++}`);
      params.push(admin_note);
    }
    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

    params.push(id);
    await db.query(`UPDATE project_feedback SET ${updates.join(', ')} WHERE feedback_id = $${paramIdx}`, params);

    await writeAudit('feedback', id, status ? `feedback_${status}` : 'feedback_note_saved', 
      status ? `Marked as ${status}` : 'Admin note updated.', req);

    res.json({ feedback_id: id, status, admin_note });
  } catch (err) {
    console.error('[feedback] PATCH /:id:', err.message);
    res.status(500).json({ error: 'Failed to update feedback', details: err.message });
  }
});

module.exports = router;
