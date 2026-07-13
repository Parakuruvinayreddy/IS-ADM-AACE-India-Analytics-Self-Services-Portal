const express = require('express');
const router = express.Router();
const db = require('../db');
const { nowIST } = require('../ist_time');
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

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT MAX(team_name) as team_name,
        MAX(contact_person) as contact_person,
        MAX(contact_email) as contact_email,
        MAX(alt_contact) as alt_contact,
        COUNT(*) as total_projects,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_projects,
        MAX(submitted_at) as last_submitted
      FROM projects 
      WHERE status != 'pending_team_lead'
      GROUP BY UPPER(team_name)
    `);
    res.json(rows);
  } catch (err) {
    console.error('[teams] GET /:', err.message);
    res.status(500).json({ error: 'Failed to fetch teams', details: err.message });
  }
});

router.get('/:team_name/projects', async (req, res) => {
  try {
    const team_name = req.params.team_name;
    const nowStr = nowIST();
    const { rows } = await db.query(`
      SELECT project_id, title, function, category, project_status, status, submitted_at, business_case, tech_stack, data_developer,
             (
               SELECT access_token FROM team_access ta
               WHERE ta.project_id = projects.project_id
                 AND ta.status = 'active'
                 AND ta.expires_at > $2
               ORDER BY ta.granted_at DESC LIMIT 1
             ) as active_token
      FROM projects 
      WHERE UPPER(team_name) = UPPER($1) 
      ORDER BY submitted_at DESC
    `, [team_name, nowStr]);

    const baseUrl = await getIntakeBaseUrl();
    const projectsWithLinks = rows.map(p => {
      if (p.active_token) {
        const maskedToken = encryptToken(p.active_token);
        p.review_link = `${baseUrl}/?token=${encodeURIComponent(maskedToken)}`;
      } else {
        p.review_link = null;
      }
      delete p.active_token;
      return p;
    });

    res.json(projectsWithLinks);
  } catch (err) {
    console.error('[teams] GET /:team_name/projects:', err.message);
    res.status(500).json({ error: 'Failed to fetch team projects', details: err.message });
  }
});

// Fetch active new project submission sessions (where project_id is NULL) for a team
router.get('/:team_name/active-tokens', async (req, res) => {
  try {
    const team_name = req.params.team_name;
    const nowStr = nowIST();
    const { rows } = await db.query(`
      SELECT access_id, ticket_id, user_email, expires_at, status, access_token
      FROM team_access
      WHERE UPPER(team_name) = UPPER($1)
        AND project_id IS NULL
        AND status = 'active'
        AND expires_at > $2
      ORDER BY granted_at DESC
    `, [team_name, nowStr]);

    const baseUrl = await getIntakeBaseUrl();
    const tokensWithUrls = rows.map(t => {
      const maskedToken = encryptToken(t.access_token);
      t.intake_url = `${baseUrl}/?token=${encodeURIComponent(maskedToken)}`;
      delete t.access_token;
      return t;
    });

    res.json(tokensWithUrls);
  } catch (err) {
    console.error('[teams] GET /:team_name/active-tokens:', err.message);
    res.status(500).json({ error: 'Failed to fetch active tokens', details: err.message });
  }
});

// DELETE /api/teams/:team_name  →  delete a team and all its projects
router.delete('/:team_name', async (req, res) => {
  const client = await db.connect();
  try {
    const team_name = req.params.team_name;
    if (!team_name) {
      client.release();
      return res.status(400).json({ error: 'Team name is required' });
    }

    await client.query('BEGIN');

    // Collect all S3 keys for this team's files BEFORE deleting from DB
    const s3 = require('../../../shared/s3Service');
    try {
      const { rows: teamFiles } = await client.query(`
        SELECT pf.file_path, pf.file_type
        FROM project_files pf
        JOIN projects p ON p.project_id = pf.project_id
        WHERE UPPER(p.team_name) = UPPER($1)
      `, [team_name]);

      if (teamFiles.length > 0) {
        const s3Keys = teamFiles.map(f => {
          const s3FileType = f.file_type === 'image' ? 'images' : 'documents';
          return s3.buildFullS3Key(s3FileType, f.file_path);
        });
        await s3.deleteMultipleFromS3(s3Keys);
        console.log(`[TEAM DELETE] Cleaned up ${s3Keys.length} S3 objects for team: ${team_name}`);
      }
    } catch (s3Err) {
      console.warn(`[TEAM DELETE] S3 cleanup error (non-blocking): ${s3Err.message}`);
    }

    // Delete projects (this will cascade delete project_files and published_projects)
    await client.query('DELETE FROM projects WHERE UPPER(team_name) = UPPER($1)', [team_name]);

    // Delete team access tokens
    await client.query('DELETE FROM team_access WHERE UPPER(team_name) = UPPER($1)', [team_name]);

    // Delete project feedback
    await client.query('DELETE FROM project_feedback WHERE UPPER(team_name) = UPPER($1)', [team_name]);

    // Delete tickets
    await client.query('DELETE FROM tickets WHERE UPPER(team_name) = UPPER($1)', [team_name]);

    await client.query('COMMIT');

    // Refresh main website cache (fire-and-forget, outside transaction)
    try {
      const axios = require('axios');
      await axios.post('http://localhost:3000/api/internal/refresh-published', {}, { timeout: 5000 });
    } catch (notifyErr) {
      console.warn('[teams] Could not notify main website backend:', notifyErr.message);
    }

    res.json({ message: `Team ${team_name} and all its associated data deleted successfully.` });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[teams] DELETE /:team_name:', err.message);
    res.status(500).json({ error: 'Failed to delete team', details: err.message });
  } finally {
    client.release();
  }
});


module.exports = router;
