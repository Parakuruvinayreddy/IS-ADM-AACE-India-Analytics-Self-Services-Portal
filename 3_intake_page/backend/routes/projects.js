const express = require('express');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const db = require('../db');
const { nowIST } = require('../ist_time');
const { resolveToken } = require('../crypto_utils');
const s3 = require('../../../shared/s3Service');

const router = express.Router();

// ── Multer setup — store in memory, write manually to correct dirs ──────────
const upload = multer({ storage: multer.memoryStorage() });
const uploadFields = upload.fields([
  { name: 'images', maxCount: 20 },
  { name: 'documents', maxCount: 20 },
  { name: 'banner', maxCount: 1 },
  { name: 'team_photo', maxCount: 1 },
]);

// ── Helpers ─────────────────────────────────────────────────────────────────

function normalizeTeamName(name) {
  if (!name) return '';
  let normalized = name.trim();
  normalized = normalized.replace(/\s+team$/i, '');
  return normalized.toUpperCase();
}

async function verifyToken(token, client) {
  const { rows } = await client.query('SELECT * FROM team_access WHERE access_token = $1', [token]);
  const record = rows[0];
  if (!record) {
    const err = new Error('Invalid token');
    err.statusCode = 401;
    throw err;
  }
  if (record.status !== 'active') {
    const err = new Error('Token has been revoked');
    err.statusCode = 401;
    throw err;
  }

  // Compare using IST
  const IST_OFFSET = 330 * 60 * 1000;
  const now = new Date(Date.now() + IST_OFFSET);

  let expires;
  const expiresRaw = record.expires_at;
  if (expiresRaw instanceof Date) {
    expires = expiresRaw;
  } else {
    let expiresStr = String(expiresRaw);
    expiresStr = expiresStr.includes('Z') ? expiresStr.replace('Z', '+00:00') : expiresStr;
    expires = new Date(expiresStr);
  }

  if (isNaN(expires.getTime()) || expires < now) {
    await client.query("UPDATE team_access SET status = 'expired' WHERE access_token = $1", [token]);
    const err = new Error('Token expired');
    err.statusCode = 401;
    throw err;
  }

  return record;
}

async function audit(client, projectId, teamName, userEmail, requestType, action, reason, statusBefore, statusAfter, version) {
  const detail = `Team: ${teamName} | Type: ${requestType} | Version: ${version || 1} | Status: ${statusBefore || ''} -> ${statusAfter || ''} | Reason: ${reason || ''}`;
  await client.query(
    `INSERT INTO audit_log (entity_id, entity_type, user_email, user_id, azure_oid, action, detail, timestamp)
     VALUES ($1, 'project', $2, NULL, NULL, $3, $4, $5)`,
    [projectId || null, userEmail || 'admin', action, detail, nowIST()]
  );
}

// ════════════════════════════════════════════════════════════
//  GET /api/projects/check?name=XYZ
// ════════════════════════════════════════════════════════════
router.get('/check', async (req, res) => {
  try {
    const rawName = req.query.name || '';
    const normalized = normalizeTeamName(rawName);
    if (!normalized || normalized === 'MAIN WEBSITE') {
      return res.json({ exists: false });
    }
    const { rows } = await db.query(
      `SELECT team_lead, contact_email 
       FROM projects 
       WHERE UPPER(TRIM(team_name)) = $1 
       ORDER BY submitted_at DESC LIMIT 1`,
      [normalized]
    );
    if (rows.length > 0) {
      return res.json({
        exists: true,
        team_lead: rows[0].team_lead,
        contact_email: rows[0].contact_email
      });
    }
    return res.json({ exists: false });
  } catch (err) {
    console.error('[CHECK TEAM] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  GET /api/projects/check-title?title=XYZ
// ════════════════════════════════════════════════════════════
router.get('/check-title', async (req, res) => {
  try {
    const title = (req.query.title || '').trim();
    const excludeId = req.query.exclude_id ? parseInt(req.query.exclude_id, 10) : null;
    console.log('[CHECK TITLE] query title:', title, 'exclude_id:', excludeId);
    
    if (!title) {
      return res.json({ exists: false });
    }
    
    let queryText = "SELECT project_id FROM projects WHERE UPPER(TRIM(title)) = $1 AND status != 'rejected'";
    const params = [title.toUpperCase()];
    
    if (excludeId && !isNaN(excludeId)) {
      queryText += " AND project_id != $2";
      params.push(excludeId);
    }
    
    queryText += " LIMIT 1";
    
    console.log('[CHECK TITLE] queryText:', queryText, 'params:', params);
    const { rows } = await db.query(queryText, params);
    console.log('[CHECK TITLE] query result rows:', rows);
    return res.json({ exists: rows.length > 0 });
  } catch (err) {
    console.error('[CHECK TITLE] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  POST /api/projects/submit
//  Replaces the FastAPI submit_projects endpoint with multer
//  for multipart form data handling.
// ════════════════════════════════════════════════════════════

router.post('/submit', uploadFields, async (req, res) => {
  const hasFiles = req.files && (
    (req.files.images && req.files.images.some(f => f.originalname)) ||
    (req.files.documents && req.files.documents.some(f => f.originalname)) ||
    (req.files.banner && req.files.banner.some(f => f.originalname)) ||
    (req.files.team_photo && req.files.team_photo.some(f => f.originalname))
  );

  if (hasFiles && !s3.S3_AVAILABLE) {
    return res.status(503).json({
      success: false,
      message: "Amazon S3 storage is temporarily unavailable. Please try again later.",
      errorCode: "S3_UNAVAILABLE"
    });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const f = req.body; // Form fields
    const rawToken = f.token;
    if (!rawToken) return res.status(400).json({ error: 'Token required' });

    // Decrypt encrypted token or fall back to raw UUID
    const token = resolveToken(rawToken);

    const record = await verifyToken(token, client);
    const finalTeamName = normalizeTeamName(f.team_name || record.team_name);
    const userEmail = record.user_email;

    const normalizedTeam = normalizeTeamName(finalTeamName);
    const projTitle = (f.title || 'Untitled Project').trim();

    // Check project title prefix
    if (!projTitle.startsWith('TE_TS_ADM_') && !projTitle.startsWith('TE_IS_ADM_')) {
      const err = new Error('Project Title must start with "TE_TS_ADM_" or "TE_IS_ADM_"');
      err.statusCode = 400;
      throw err;
    }

    const categoryVal = (f.category || '').trim();

    // Check for duplicate projects globally by title
    const { rows: existingRows } = await client.query(
      "SELECT project_id FROM projects WHERE UPPER(TRIM(title)) = $1 AND status != 'rejected'",
      [projTitle.toUpperCase()]
    );
    if (existingRows.length > 0) {
      const err = new Error(`A project with the title "${projTitle}" has already been submitted.`);
      err.statusCode = 400;
      throw err;
    }

    // Map Completed to Live and handle dates
    let projectStatusVal = (f.project_status || '').trim();
    if (projectStatusVal === 'Completed') {
      projectStatusVal = 'Live';
    }
    let startDateVal = f.start_date || '';
    let endDateVal = f.end_date || '';
    if (projectStatusVal === 'Live') {
      startDateVal = '';
      endDateVal = '';
    }

    // Resolve contacts (same logic as FastAPI)
    const resolvedContactPerson = f.contact_person || f.team_lead || '';
    const resolvedContactEmail = f.contact_email || f.contact_person_email || '';
    const resolvedAltContact = f.contact_person_email || '';

    // Handle custom category-specific details
    let businessCaseVal = f.business_case || '';
    let techStackVal = f.tech_stack || '';
    if (categoryVal === 'Dashboard') {
      businessCaseVal = '';
      techStackVal = '';
    } else if (categoryVal === 'AI Solution' || categoryVal === 'Data Product') {
      techStackVal = '';
    }

    let dashboardLinkVal = f.dashboard_link || '';
    let dataSourceVal = f.data_source || '';
    let dataOwnerVal = f.data_owner || '';
    let dataValidatedByVal = f.data_validated_by || '';
    let dashboardDeveloperVal = f.dashboard_developer || '';
    let dataDeveloperVal = f.data_developer || '';
    let dashboardOwnerVal = f.dashboard_owner || '';
    let lastValidatedVal = f.last_validated || '';
    let drillDownVal = f.drill_down || '';
 
    // Clean data information fields based on status and category
    if (!['Dashboard', 'AI Solution', 'Data Product', 'Plants'].includes(categoryVal) || projectStatusVal === 'Planning') {
      dashboardLinkVal = '';
      dataSourceVal = '';
      dataOwnerVal = '';
      dataValidatedByVal = '';
      dashboardDeveloperVal = '';
      dataDeveloperVal = '';
      dashboardOwnerVal = '';
      lastValidatedVal = '';
      drillDownVal = '';
    }
 
    // Insert project
    const istNow = nowIST();
    const insertResult = await client.query(
      `INSERT INTO projects (
          team_name, team_lead, title, function, description,
          contact_person, contact_email, alt_contact,
          why_we_use_it, who_manages_it,
          escalation1_name, escalation1_email,
          escalation2_name, escalation2_email,
          dashboard_link, project_status, start_date, end_date,
          data_source, data_owner, data_validated_by,
          dashboard_developer, data_developer, dashboard_owner, last_validated,
          milestones, fields_selected, category,
          business_case, tech_stack, drill_down,
          status, version, submitted_at, updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,'pending_team_lead',1,$32,$33)
      RETURNING project_id`,
      [
        finalTeamName,
        f.team_lead || '',
        f.title || 'Untitled Project',
        f.function_area || '',
        f.description || '',
        resolvedContactPerson,
        resolvedContactEmail,
        resolvedAltContact,
        f.why_we_use_it || '',
        f.who_manages_it || '',
        f.escalation1_name || '',
        f.escalation1_email || '',
        f.escalation2_name || '',
        f.escalation2_email || '',
        dashboardLinkVal || '',
        projectStatusVal || '',
        startDateVal || '',
        endDateVal || '',
        dataSourceVal || '',
        dataOwnerVal || '',
        dataValidatedByVal || '',
        dashboardDeveloperVal || '',
        dataDeveloperVal || '',
        dashboardOwnerVal || '',
        lastValidatedVal || '',
        f.milestones || '[]',
        '', // fields_selected — not used
        f.category || '',
        businessCaseVal || '',
        techStackVal || '',
        drillDownVal || '',
        istNow,
        istNow,
      ]
    );
    const projectId = insertResult.rows[0].project_id;

    const uploadedS3Keys = [];

    // ── Upload images to S3 ────────────────────────────────────────────────
    const imageFiles = req.files && req.files.images ? req.files.images : [];
    for (let idx = 0; idx < imageFiles.length; idx++) {
      const img = imageFiles[idx];
      if (img.originalname) {
        // Validate file type and size
        const validation = s3.validateFile(img, 'image');
        if (!validation.valid) {
          const err = new Error(validation.error);
          err.statusCode = 400;
          err.errorCode = validation.errorCode;
          throw err;
        }

        const uniqueName = s3.uniqueFilename(img.originalname);
        const relPath = s3.buildRelativePath(finalTeamName, f.title || 'Untitled', uniqueName);
        const s3Key = s3.buildFullS3Key('images', relPath);
        const contentType = s3.getContentType(img.originalname);

        // Upload with Metadata
        await s3.uploadToS3(img.buffer, s3Key, contentType, {
          'team-name': finalTeamName,
          'project-name': f.title || 'Untitled',
          'original-file-name': img.originalname,
          'uploaded-by': userEmail,
          'upload-timestamp': nowIST(),
          'file-category': 'image',
        });
        uploadedS3Keys.push(s3Key);

        await client.query(
          'INSERT INTO project_files (project_id, file_type, file_name, file_path, uploaded_at) VALUES ($1, $2, $3, $4, $5)',
          [projectId, 'image', uniqueName, relPath, nowIST()]
        );
      }
    }

    // ── Upload documents to S3 ────────────────────────────────────────────
    const docFiles = req.files && req.files.documents ? req.files.documents : [];
    for (let idx = 0; idx < docFiles.length; idx++) {
      const doc = docFiles[idx];
      if (doc.originalname) {
        // Validate file type and size
        const validation = s3.validateFile(doc, 'document');
        if (!validation.valid) {
          const err = new Error(validation.error);
          err.statusCode = 400;
          err.errorCode = validation.errorCode;
          throw err;
        }

        const uniqueName = s3.uniqueFilename(doc.originalname);
        const relPath = s3.buildRelativePath(finalTeamName, f.title || 'Untitled', uniqueName);
        const s3Key = s3.buildFullS3Key('documents', relPath);
        const contentType = s3.getContentType(doc.originalname);

        // Upload with Metadata
        await s3.uploadToS3(doc.buffer, s3Key, contentType, {
          'team-name': finalTeamName,
          'project-name': f.title || 'Untitled',
          'original-file-name': doc.originalname,
          'uploaded-by': userEmail,
          'upload-timestamp': nowIST(),
          'file-category': 'document',
        });
        uploadedS3Keys.push(s3Key);

        await client.query(
          'INSERT INTO project_files (project_id, file_type, file_name, file_path, uploaded_at) VALUES ($1, $2, $3, $4, $5)',
          [projectId, 'document', uniqueName, relPath, nowIST()]
        );
      }
    }

    // ── Banner / team photo (optional) → upload to S3 under images ────────
    const bannerFiles = req.files && req.files.banner ? req.files.banner : [];
    if (bannerFiles.length > 0 && bannerFiles[0].originalname) {
      const validation = s3.validateFile(bannerFiles[0], 'image');
      if (!validation.valid) {
        const err = new Error(validation.error);
        err.statusCode = 400;
        err.errorCode = validation.errorCode;
        throw err;
      }
      const bannerName = s3.uniqueFilename(`banner${path.extname(bannerFiles[0].originalname) || '.png'}`);
      const bannerRelPath = s3.buildRelativePath(finalTeamName, f.title || 'Untitled', bannerName);
      const bannerS3Key = s3.buildFullS3Key('images', bannerRelPath);
      
      await s3.uploadToS3(bannerFiles[0].buffer, bannerS3Key, s3.getContentType(bannerFiles[0].originalname), {
        'team-name': finalTeamName,
        'project-name': f.title || 'Untitled',
        'original-file-name': bannerFiles[0].originalname,
        'uploaded-by': userEmail,
        'upload-timestamp': nowIST(),
        'file-category': 'image',
      });
      uploadedS3Keys.push(bannerS3Key);
    }
    const teamPhotoFiles = req.files && req.files.team_photo ? req.files.team_photo : [];
    if (teamPhotoFiles.length > 0 && teamPhotoFiles[0].originalname) {
      const validation = s3.validateFile(teamPhotoFiles[0], 'image');
      if (!validation.valid) {
        const err = new Error(validation.error);
        err.statusCode = 400;
        err.errorCode = validation.errorCode;
        throw err;
      }
      const photoName = s3.uniqueFilename(`team_photo${path.extname(teamPhotoFiles[0].originalname) || '.png'}`);
      const photoRelPath = s3.buildRelativePath(finalTeamName, f.title || 'Untitled', photoName);
      const photoS3Key = s3.buildFullS3Key('images', photoRelPath);
      
      await s3.uploadToS3(teamPhotoFiles[0].buffer, photoS3Key, s3.getContentType(teamPhotoFiles[0].originalname), {
        'team-name': finalTeamName,
        'project-name': f.title || 'Untitled',
        'original-file-name': teamPhotoFiles[0].originalname,
        'uploaded-by': userEmail,
        'upload-timestamp': nowIST(),
        'file-category': 'image',
      });
      uploadedS3Keys.push(photoS3Key);
    }

    // Audit log
    await audit(client, projectId, finalTeamName, userEmail, 'NEW', 'submitted_for_team_lead_review', '', '', 'pending_team_lead', 1);

    // Associate the project_id but keep the token ACTIVE so the team lead can use it
    await client.query(
      "UPDATE team_access SET project_id = $1 WHERE access_token = $2",
      [projectId, token]
    );

    // Trigger Email to Team Lead
    try {
      const { sendEmail } = require('../email');
      const { encryptToken } = require('../crypto_utils');
      
      const baseUrl = process.env.INTAKE_BASE_URL || 'http://localhost:5175/intake';
      const maskedToken = encryptToken(token);
      const intake_url = `${baseUrl}/?token=${encodeURIComponent(maskedToken)}`;
      
      const emailSubject = `[ADM Analytics] Action Required: Team Lead Review for Project ${projTitle}`;
      const emailBody = `
        <p>Hello,</p>
        <p>A new project submission has been drafted by your team member and is pending your review and approval:</p>
        <p><strong>Project Title:</strong> ${projTitle}</p>
        <p><strong>Team Name:</strong> ${finalTeamName}</p>
        <br/>
        <p>Please click the secure link below to review the project details and submit it for final Admin review:</p>
        <p><a href="${intake_url}">${intake_url}</a></p>
        <br/>
        <p>Regards,<br/>ADM Admin System</p>
      `;
      
      sendEmail(resolvedContactEmail, emailSubject, emailBody).catch(e => console.error('Email failed:', e));
    } catch (err) {
      console.error('Failed to trigger Team Lead email notification:', err.message);
    }

    await client.query('COMMIT');
    return res.json({ success: true, project_id: projectId });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    
    // Prevent orphan files: Clean up all S3 uploads from this request
    if (uploadedS3Keys.length > 0) {
      console.warn(`[SUBMIT ROLLBACK] Cleaning up ${uploadedS3Keys.length} uploaded S3 objects to prevent orphan files...`);
      await s3.deleteMultipleFromS3(uploadedS3Keys).catch(cleanupErr => {
        console.error('[SUBMIT ROLLBACK] Failed to delete S3 orphan files during rollback:', cleanupErr.message);
      });
    }

    const status = err.statusCode || 500;
    console.error('[SUBMIT] Error:', err.message);
    
    // Standardized safe API response (no raw AWS exceptions)
    if (err.errorCode || err.name || err.code || err.message?.includes('S3') || err.message?.includes('AWS')) {
      const s3ErrorMeta = s3.handleS3Error(err, 'Unable to upload file to Amazon S3.');
      return res.status(s3ErrorMeta.statusCode || status).json({
        success: false,
        message: err.errorCode ? err.message : s3ErrorMeta.message,
        errorCode: err.errorCode || s3ErrorMeta.errorCode
      });
    }
    return res.status(status).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ════════════════════════════════════════════════════════════
//  GET /api/projects/my?token=xxx
// ════════════════════════════════════════════════════════════

router.get('/my', async (req, res) => {
  const client = await db.connect();
  try {
    const record = await verifyToken(resolveToken(req.query.token), client);
    const { rows } = await client.query(
      'SELECT * FROM projects WHERE team_name = $1 ORDER BY submitted_at DESC',
      [record.team_name]
    );
    return res.json(rows);
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ════════════════════════════════════════════════════════════
//  GET /api/projects/:project_id
// ════════════════════════════════════════════════════════════

router.get('/:project_id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.project_id, 10);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project id' });
    }
    const { rows } = await db.query(
      `SELECT p.*, string_agg(f.file_name, ',') AS files
       FROM projects p
       LEFT JOIN project_files f ON p.project_id = f.project_id
       WHERE p.project_id = $1
       GROUP BY p.project_id`,
      [projectId]
    );
    const project = rows[0];
    if (!project || !project.project_id) {
      return res.status(404).json({ detail: 'Not found' });
    }
    const fileResult = await db.query(
      'SELECT file_name, file_type, file_path FROM project_files WHERE project_id = $1',
      [projectId]
    );
    project.uploaded_files = fileResult.rows;
    return res.json(project);
  } catch (err) {
    console.error('[GET PROJECT] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  PUT /api/projects/:project_id
//  Edit project — same change tracking as FastAPI version.
// ════════════════════════════════════════════════════════════

router.put('/:project_id', uploadFields, async (req, res) => {
  const hasFiles = req.files && (
    (req.files.images && req.files.images.some(f => f.originalname)) ||
    (req.files.documents && req.files.documents.some(f => f.originalname)) ||
    (req.files.banner && req.files.banner.some(f => f.originalname)) ||
    (req.files.team_photo && req.files.team_photo.some(f => f.originalname))
  );

  if (hasFiles && !s3.S3_AVAILABLE) {
    return res.status(503).json({
      success: false,
      message: "Amazon S3 storage is temporarily unavailable. Please try again later.",
      errorCode: "S3_UNAVAILABLE"
    });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const uploadedS3Keys = [];
    const projectId = req.params.project_id;
    const f = req.body;
    const rawToken = f.token;
    if (!rawToken) return res.status(400).json({ error: 'Token required' });

    // Decrypt encrypted token or fall back to raw UUID
    const token = resolveToken(rawToken);

    const record = await verifyToken(token, client);
    const verifiedTeamName = record.team_name;

    // Fetch existing project
    const projResult = await client.query('SELECT * FROM projects WHERE project_id = $1', [projectId]);
    const project = projResult.rows[0];
    if (!project) return res.status(404).json({ detail: 'Not found' });
    if (record.project_id !== parseInt(projectId, 10) && normalizeTeamName(project.team_name) !== normalizeTeamName(verifiedTeamName)) {
      return res.status(403).json({ detail: 'Forbidden' });
    }

    let targetTeamName = project.team_name;
    const isMainWebsite = normalizeTeamName(verifiedTeamName) === 'MAIN WEBSITE';
    if (isMainWebsite && f.team_name) {
      const newTeam = normalizeTeamName(f.team_name);
      if (newTeam && newTeam !== 'MAIN WEBSITE') {
        targetTeamName = newTeam;
        // Update the token's team_name in team_access table
        await client.query(
          "UPDATE team_access SET team_name = $1 WHERE access_token = $2",
          [newTeam, token]
        );
      }
    }

    // Resolve contacts
    const resolvedContactPerson = f.contact_person || project.contact_person;
    const resolvedAltContact = f.contact_person_email || project.alt_contact || '';

    // Build new values (prefer submitted value, fall back to existing)
    const newVals = {
      team_lead: f.team_lead || project.team_lead || '',
      title: f.title || project.title,
      function: f.function_area || project.function || '',
      category: f.category || project.category || '',
      description: f.description || project.description || '',
      contact_person: resolvedContactPerson,
      alt_contact: resolvedAltContact,
      why_we_use_it: f.why_we_use_it || project.why_we_use_it || '',
      who_manages_it: f.who_manages_it || project.who_manages_it || '',
      escalation1_name: f.escalation1_name || project.escalation1_name || '',
      escalation1_email: f.escalation1_email || project.escalation1_email || '',
      escalation2_name: f.escalation2_name || project.escalation2_name || '',
      escalation2_email: f.escalation2_email || project.escalation2_email || '',
      dashboard_link: f.dashboard_link || project.dashboard_link || '',
      project_status: f.project_status || project.project_status || '',
      start_date: f.start_date || project.start_date || '',
      end_date: f.end_date || project.end_date || '',
      data_source: f.data_source || project.data_source || '',
      data_owner: f.data_owner || project.data_owner || '',
      data_validated_by: f.data_validated_by || project.data_validated_by || '',
      dashboard_developer: f.dashboard_developer || project.dashboard_developer || '',
      dashboard_owner: f.dashboard_owner || project.dashboard_owner || '',
      last_validated: f.last_validated || project.last_validated || '',
      business_case: f.business_case || project.business_case || '',
      tech_stack: f.tech_stack || project.tech_stack || '',
      data_developer: f.data_developer || project.data_developer || '',
      drill_down: f.drill_down || project.drill_down || '',
    };

    const normalizedTeam = normalizeTeamName(targetTeamName);
    const newTitle = (newVals.title || '').trim();

    // Enforce title prefix check
    if (!newTitle.startsWith('TE_TS_ADM_') && !newTitle.startsWith('TE_IS_ADM_')) {
      const err = new Error('Project Title must start with "TE_TS_ADM_" or "TE_IS_ADM_"');
      err.statusCode = 400;
      throw err;
    }

    // Map Completed to Live and handle dates
    if (newVals.project_status === 'Completed') {
      newVals.project_status = 'Live';
    }
    if (newVals.project_status === 'Live') {
      newVals.start_date = '';
      newVals.end_date = '';
    }

    if (newVals.category === 'Dashboard') {
      newVals.business_case = '';
      newVals.tech_stack = '';
    } else if (newVals.category === 'AI Solution' || newVals.category === 'Data Product') {
      newVals.tech_stack = '';
    }

    // Clean data information fields based on status and category
    if (!['Dashboard', 'AI Solution', 'Data Product', 'Plants'].includes(newVals.category) || newVals.project_status === 'Planning') {
      newVals.dashboard_link = '';
      newVals.data_source = '';
      newVals.data_owner = '';
      newVals.data_validated_by = '';
      newVals.dashboard_developer = '';
      newVals.data_developer = '';
      newVals.dashboard_owner = '';
      newVals.last_validated = '';
      newVals.drill_down = '';
    }

    // Check for duplicate projects globally by title on update
    const { rows: existingRows } = await client.query(
      "SELECT project_id FROM projects WHERE UPPER(TRIM(title)) = $1 AND project_id != $2 AND status != 'rejected'",
      [newTitle.toUpperCase(), projectId]
    );
    if (existingRows.length > 0) {
      const err = new Error(`Another project with the title "${newTitle}" has already been submitted.`);
      err.statusCode = 400;
      throw err;
    }

    // Detect what actually changed
    const COMPARE_FIELDS = [
      ['team_lead', 'Team Lead'],
      ['title', 'Title'], ['function', 'Function'], ['category', 'Category'],
      ['description', 'Description'], ['contact_person', 'Contact Person'],
      ['why_we_use_it', 'Why We Use It'], ['who_manages_it', 'Who Manages It'],
      ['escalation1_name', 'Escalation 1'], ['escalation1_email', 'Escalation 1 Email'],
      ['escalation2_name', 'Escalation 2'], ['escalation2_email', 'Escalation 2 Email'],
      ['dashboard_link', 'Dashboard Link'], ['project_status', 'Project Status'],
      ['start_date', 'Start Date'], ['end_date', 'End Date'],
      ['data_source', 'Data Source'], ['data_owner', 'Data Owner'],
      ['data_validated_by', 'Validated By'], ['dashboard_developer', 'Developer'],
      ['dashboard_owner', 'Dashboard Owner'], ['last_validated', 'Last Validated'],
      ['drill_down', 'Drill Down'],
      ['data_developer', 'Data Developer'], ['business_case', 'Business Case'],
      ['tech_stack', 'Tech Stack'],
    ];

    const changes = [];
    for (const [dbKey, label] of COMPARE_FIELDS) {
      const oldVal = String(project[dbKey] || '').trim();
      const newVal = String(newVals[dbKey] || '').trim();
      if (oldVal !== newVal) {
        changes.push(`${label}: '${oldVal}' → '${newVal}'`);
      }
    }

    const imageFiles = req.files && req.files.images ? req.files.images : [];
    const docFiles = req.files && req.files.documents ? req.files.documents : [];
    const hasNewImages = imageFiles.length > 0 && imageFiles.some((i) => i.originalname);
    const hasNewDocs = docFiles.length > 0 && docFiles.some((d) => d.originalname);
    if (hasNewImages) changes.push('Images: updated');
    if (hasNewDocs) changes.push('Documents: updated');

    const changeSummary = changes.length > 0 ? changes.join('; ') : 'No changes detected';

    const isTeamLeadApproval = project.status === 'pending_team_lead';
    const nextProjectStatus = isTeamLeadApproval ? 'submitted' : 'pending_team_lead';

    // Update project
    await client.query(
      `UPDATE projects
       SET team_name=$1, team_lead=$2, title=$3, function=$4, category=$5, description=$6,
           contact_person=$7, alt_contact=$8,
           why_we_use_it=$9, who_manages_it=$10,
           escalation1_name=$11, escalation1_email=$12,
           escalation2_name=$13, escalation2_email=$14,
           dashboard_link=$15, project_status=$16, start_date=$17, end_date=$18,
           data_source=$19, data_owner=$20, data_validated_by=$21,
           dashboard_developer=$22, data_developer=$23, dashboard_owner=$24, last_validated=$25,
           milestones=$26, business_case=$27, tech_stack=$28, drill_down=$29,
           status=$30, version=version+1, updated_at=$31,
           submitted_at=CASE WHEN $30 = 'submitted' THEN $31 ELSE submitted_at END
       WHERE project_id=$32`,
      [
        targetTeamName,
        newVals.team_lead,
        newVals.title, newVals.function, newVals.category,
        newVals.description, newVals.contact_person, newVals.alt_contact,
        newVals.why_we_use_it, newVals.who_manages_it,
        newVals.escalation1_name, newVals.escalation1_email,
        newVals.escalation2_name, newVals.escalation2_email,
        newVals.dashboard_link, newVals.project_status,
        newVals.start_date, newVals.end_date,
        newVals.data_source, newVals.data_owner, newVals.data_validated_by,
        newVals.dashboard_developer, newVals.data_developer, newVals.dashboard_owner, newVals.last_validated,
        newVals.milestones, newVals.business_case, newVals.tech_stack,
        newVals.drill_down,
        nextProjectStatus,
        nowIST(),
        projectId,
      ]
    );

    // ── Handle new images — delete old from S3, upload new ──────────────
    if (hasNewImages) {
      // Fetch old image S3 keys before deleting DB records
      const { rows: oldImages } = await client.query(
        "SELECT file_path, file_type FROM project_files WHERE project_id=$1 AND file_type='image'",
        [projectId]
      );
      const oldImageKeys = oldImages.map(f => s3.buildFullS3Key('images', f.file_path));

      await client.query("DELETE FROM project_files WHERE project_id=$1 AND file_type='image'", [projectId]);

      // Delete old images from S3 (fire-and-forget, don't block transaction)
      s3.deleteMultipleFromS3(oldImageKeys).catch(e => console.warn('[EDIT] S3 cleanup (images) error:', e.message));

      for (let idx = 0; idx < imageFiles.length; idx++) {
        const img = imageFiles[idx];
        if (img.originalname) {
          const validation = s3.validateFile(img, 'image');
          if (!validation.valid) {
            const err = new Error(validation.error);
            err.statusCode = 400;
            err.errorCode = validation.errorCode;
            throw err;
          }

          const uniqueName = s3.uniqueFilename(img.originalname);
          const relPath = s3.buildRelativePath(targetTeamName, newVals.title, uniqueName);
          const s3Key = s3.buildFullS3Key('images', relPath);
          const contentType = s3.getContentType(img.originalname);
          
          await s3.uploadToS3(img.buffer, s3Key, contentType, {
            'team-name': targetTeamName,
            'project-name': newVals.title || 'Untitled',
            'original-file-name': img.originalname,
            'uploaded-by': record.user_email,
            'upload-timestamp': nowIST(),
            'file-category': 'image',
          });
          uploadedS3Keys.push(s3Key);

          await client.query(
            'INSERT INTO project_files (project_id, file_type, file_name, file_path, uploaded_at) VALUES ($1, $2, $3, $4, $5)',
            [projectId, 'image', uniqueName, relPath, nowIST()]
          );
        }
      }
    }

    // ── Handle new documents — delete old from S3, upload new ────────────
    if (hasNewDocs) {
      // Fetch old document S3 keys before deleting DB records
      const { rows: oldDocs } = await client.query(
        "SELECT file_path, file_type FROM project_files WHERE project_id=$1 AND file_type='document'",
        [projectId]
      );
      const oldDocKeys = oldDocs.map(f => s3.buildFullS3Key('documents', f.file_path));

      await client.query("DELETE FROM project_files WHERE project_id=$1 AND file_type='document'", [projectId]);

      // Delete old documents from S3
      s3.deleteMultipleFromS3(oldDocKeys).catch(e => console.warn('[EDIT] S3 cleanup (docs) error:', e.message));

      for (let idx = 0; idx < docFiles.length; idx++) {
        const doc = docFiles[idx];
        if (doc.originalname) {
          const validation = s3.validateFile(doc, 'document');
          if (!validation.valid) {
            const err = new Error(validation.error);
            err.statusCode = 400;
            err.errorCode = validation.errorCode;
            throw err;
          }

          const uniqueName = s3.uniqueFilename(doc.originalname);
          const relPath = s3.buildRelativePath(targetTeamName, newVals.title, uniqueName);
          const s3Key = s3.buildFullS3Key('documents', relPath);
          const contentType = s3.getContentType(doc.originalname);

          await s3.uploadToS3(doc.buffer, s3Key, contentType, {
            'team-name': targetTeamName,
            'project-name': newVals.title || 'Untitled',
            'original-file-name': doc.originalname,
            'uploaded-by': record.user_email,
            'upload-timestamp': nowIST(),
            'file-category': 'document',
          });
          uploadedS3Keys.push(s3Key);

          await client.query(
            'INSERT INTO project_files (project_id, file_type, file_name, file_path, uploaded_at) VALUES ($1, $2, $3, $4, $5)',
            [projectId, 'document', uniqueName, relPath, nowIST()]
          );
        }
      }
    }

    // Audit log with change summary
    await audit(
      client, projectId, verifiedTeamName, record.user_email, 'EDIT', 'resubmitted',
      changeSummary, project.status, nextProjectStatus, project.version + 1
    );

    // Expire the token after submission only if it has passed Team Lead approval
    if (isTeamLeadApproval) {
      await client.query(
        "UPDATE team_access SET status = 'expired' WHERE access_token = $1",
        [token]
      );
    }

    await client.query('COMMIT');

    // Trigger confirmation / notification emails based on who approved/submitted
    if (isTeamLeadApproval) {
      try {
        const { sendEmail } = require('../email');
        const emailSubject = `[ADM Analytics] Project Submitted for Admin Review: ${newVals.title}`;
        const emailBody = `
          <p>Hello,</p>
          <p>The project submission <strong>${newVals.title}</strong> has been successfully reviewed and approved by the Team Lead, and has now been submitted to the ADM Analytics Admin team for final review.</p>
          <p><strong>Team Name:</strong> ${targetTeamName}</p>
          <p><strong>Team Lead:</strong> ${newVals.team_lead}</p>
          <br/>
          <p>You will receive a confirmation email once the admin reviews and publishes the project.</p>
          <br/>
          <p>Regards,<br/>ADM Admin System</p>
        `;
        
        if (record.user_email) {
          sendEmail(record.user_email, emailSubject, emailBody).catch(e => console.error('Email to user failed:', e));
        }
        if (newVals.contact_email && newVals.contact_email !== record.user_email) {
          sendEmail(newVals.contact_email, emailSubject, emailBody).catch(e => console.error('Email to team lead failed:', e));
        }
      } catch (err) {
        console.error('Failed to trigger confirmation emails:', err.message);
      }
    } else {
      // Trigger Email to Team Lead for user edit submission
      try {
        const { sendEmail } = require('../email');
        const { encryptToken } = require('../crypto_utils');
        
        const baseUrl = process.env.INTAKE_BASE_URL || 'http://localhost:5175/intake';
        const maskedToken = encryptToken(token);
        const intake_url = `${baseUrl}/?token=${encodeURIComponent(maskedToken)}`;
        
        const emailSubject = `[ADM Analytics] Action Required: Team Lead Review for Updated Project ${newVals.title}`;
        const emailBody = `
          <p>Hello,</p>
          <p>An existing project has been updated by your team member <strong>${record.user_email}</strong> who raised the edit request, and is pending your review and approval:</p>
          <p><strong>Project Title:</strong> ${newVals.title}</p>
          <p><strong>Team Name:</strong> ${targetTeamName}</p>
          <br/>
          <p>Please click the secure link below to review the changes and submit them for final Admin review:</p>
          <p><a href="${intake_url}">${intake_url}</a></p>
          <br/>
          <p>Regards,<br/>ADM Admin System</p>
        `;
        
        sendEmail(newVals.contact_email || record.user_email, emailSubject, emailBody).catch(e => console.error('Email to team lead failed:', e));
      } catch (err) {
        console.error('Failed to trigger Team Lead email notification for edit:', err.message);
      }
    }

    // If this edit was tied to a Required Changes feedback entry, mark it as resubmitted
    const feedbackId = f.feedback_id;
    if (feedbackId) {
      try {
        await axios.patch(
          `http://localhost:3001/api/feedback/${feedbackId}`,
          { status: 'resubmitted' },
          { timeout: 10000 }
        );
      } catch (e) {
        console.log(`[WARN] Could not update feedback status: ${e.message}`);
      }
    }

    // Notify admin backend about edit submission
    try {
      await axios.post(
        'http://localhost:3001/api/internal/edit-submitted',
        {
          project_id: parseInt(projectId, 10),
          team_name: verifiedTeamName,
          user_email: record.user_email,
          version: project.version + 1,
          change_summary: changeSummary,
          feedback_id: feedbackId ? parseInt(feedbackId, 10) : null,
        },
        { timeout: 10000 }
      );
    } catch (e) {
      console.log(`[WARN] Could not notify admin backend: ${e.message}`);
    }

    // Resolve the ticket if this edit was linked to a ticket
    const ticketIdVal = record.ticket_id || null;
    if (ticketIdVal) {
      try {
        await axios.patch(
          `http://localhost:3001/api/tickets/${ticketIdVal}/status`,
          { status: 'resolved' },
          { timeout: 10000 }
        );
      } catch (e) {
        console.log(`[WARN] Could not resolve ticket #${ticketIdVal}: ${e.message}`);
      }
    }

    return res.json({
      success: true,
      project_id: parseInt(projectId, 10),
      version: project.version + 1,
      status: 'submitted',
      change_summary: changeSummary,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    
    // Prevent orphan files: Clean up S3 uploads from this edit request
    if (uploadedS3Keys.length > 0) {
      console.warn(`[EDIT ROLLBACK] Cleaning up ${uploadedS3Keys.length} uploaded S3 objects to prevent orphan files...`);
      await s3.deleteMultipleFromS3(uploadedS3Keys).catch(cleanupErr => {
        console.error('[EDIT ROLLBACK] Failed to delete S3 orphan files during rollback:', cleanupErr.message);
      });
    }

    const status = err.statusCode || 500;
    console.error('[EDIT] Error:', err.message);
    if (err.errorCode || err.name || err.code || err.message?.includes('S3') || err.message?.includes('AWS')) {
      const s3ErrorMeta = s3.handleS3Error(err, 'Unable to upload file to Amazon S3.');
      return res.status(s3ErrorMeta.statusCode || status).json({
        success: false,
        message: err.errorCode ? err.message : s3ErrorMeta.message,
        errorCode: err.errorCode || s3ErrorMeta.errorCode
      });
    }
    return res.status(status).json({ error: err.message });
  } finally {
    client.release();
  }
});


// ════════════════════════════════════════════════════════════
//  DELETE /api/projects/:project_id/files/:file_name
// ════════════════════════════════════════════════════════════
router.delete('/:project_id/files/:file_name', async (req, res) => {
  const client = await db.connect();
  try {
    const projectId = parseInt(req.params.project_id, 10);
    const fileName = req.params.file_name;
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project id' });
    }

    const token = resolveToken(req.query.token || '');
    if (token) {
      await verifyToken(token, client);
    }

    // Fetch the file record to get its S3 key before deleting from DB
    const { rows: fileRows } = await client.query(
      'SELECT file_path, file_type FROM project_files WHERE project_id = $1 AND file_name = $2',
      [projectId, fileName]
    );

    await client.query(
      'DELETE FROM project_files WHERE project_id = $1 AND file_name = $2',
      [projectId, fileName]
    );

    // Delete from S3 if the file record was found
    if (fileRows.length > 0) {
      const fileRecord = fileRows[0];
      const s3FileType = fileRecord.file_type === 'image' ? 'images' : 'documents';
      const s3Key = s3.buildFullS3Key(s3FileType, fileRecord.file_path);
      s3.deleteFromS3(s3Key).catch(e => console.warn(`[DELETE FILE] S3 cleanup error: ${e.message}`));
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('[DELETE FILE] Error:', err.message);
    return res.status(err.statusCode || 500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
