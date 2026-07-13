const express = require('express');
const { adminPool } = require('../db');

const router = express.Router();

// ════════════════════════════════════════════════════════════
//  GET /api/published-projects
//  Reads from adm_admin_db — same query as the Flask version.
//  Returns a plain JSON array so the React frontend can
//  Array.isArray() it directly.
// ════════════════════════════════════════════════════════════

router.get('/', async (req, res) => {
  try {
    const { rows } = await adminPool.query(`
      SELECT
          pp.published_id   AS pub_id,
          pp.project_id,
          pp.published_at,
          p.team_name,
          p.team_lead,
          p.title,
          p.function,
          p.category,
          p.description,
          p.why_we_use_it,
          p.who_manages_it,
          p.contact_person,
          p.contact_email,
          p.alt_contact,
          p.escalation1_name,
          p.escalation1_email,
          p.escalation2_name,
          p.escalation2_email,
          p.data_source,
          p.data_owner,
          p.data_validated_by,
          p.dashboard_developer,
          p.data_developer,
          p.dashboard_owner,
          p.last_validated,
          p.fields_selected,
          p.project_status,
          p.start_date,
          p.end_date,
          p.milestones,
          p.dashboard_link,
          p.drill_down,
          (
            SELECT pf.file_path
            FROM   project_files pf
            WHERE  pf.project_id = pp.project_id
              AND  pf.file_type  = 'image'
            LIMIT  1
          ) AS image_path
      FROM  published_projects pp
      JOIN  projects           p  ON p.project_id = pp.project_id
      ORDER BY pp.published_at DESC
    `);

    // Bulk-fetch all project files in a single query (fixes N+1: was 1 query per project)
    const projectIds = rows.map(r => r.project_id);
    let filesMap = {};
    if (projectIds.length > 0) {
      const filesResult = await adminPool.query(
        `SELECT project_id, file_type, file_name, file_path
         FROM   project_files
         WHERE  project_id = ANY($1)
         ORDER BY uploaded_at ASC`,
        [projectIds]
      );
      // Group files by project_id
      for (const f of filesResult.rows) {
        if (!filesMap[f.project_id]) filesMap[f.project_id] = [];
        filesMap[f.project_id].push(f);
      }
    }

    // Attach images and documents to each row
    for (const row of rows) {
      const files = filesMap[row.project_id] || [];
      row.images = files.filter((f) => f.file_type === 'image');
      row.documents = files.filter((f) => f.file_type === 'document');
    }

    return res.json(rows);
  } catch (err) {
    console.error('[PUBLISHED] Failed to read adm_admin_db:', err.message);
    return res.json([]);
  }
});

module.exports = router;
