require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });
const express = require('express');

// ── Process-level error handlers — prevent crashes ─────────
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.message, err.stack);
  // Do NOT call process.exit() — keep the server running
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Promise Rejection:', reason);
});
const cors = require('cors');
const path = require('path');

const app = express();

// ── Middleware ──────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Request logging & timing middleware ──────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`[SLOW REQUEST] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// ── S3 Service ─────────────────────────────────────────────────
const s3 = require('../../shared/s3Service');

// ── S3 Proxy — serve files from S3 (replaces express.static) ──
// These endpoints maintain the same URL pattern so frontends need no changes.
// GET /uploads/images/<team>/<title>/<file>  →  S3: CDD/images/<team>/<title>/<file>
// GET /uploads/documents/<team>/<title>/<file>  →  S3: CDD/documents/<team>/<title>/<file>
app.get('/uploads/images/*', async (req, res) => {
  try {
    const relativePath = req.params[0];
    if (!relativePath) return res.status(400).json({ error: 'File path required' });

    const s3Key = s3.buildFullS3Key('images', relativePath);
    const result = await s3.getFromS3(s3Key);

    if (!result) return res.status(404).json({ error: 'Image not found' });

    // HTTP Caching validation (Conditional GET)
    const clientETag = req.headers['if-none-match'];
    if (clientETag && result.etag && clientETag === result.etag) {
      return res.status(304).end();
    }
    const clientModSince = req.headers['if-modified-since'];
    if (clientModSince && result.lastModified) {
      const clientDate = new Date(clientModSince);
      const serverDate = new Date(result.lastModified);
      if (Math.floor(serverDate.getTime() / 1000) <= Math.floor(clientDate.getTime() / 1000)) {
        return res.status(304).end();
      }
    }

    res.set('Content-Type', result.contentType);
    if (result.contentLength) res.set('Content-Length', String(result.contentLength));
    if (result.etag) res.set('ETag', result.etag);
    if (result.lastModified) res.set('Last-Modified', new Date(result.lastModified).toUTCString());
    res.set('Cache-Control', 'public, max-age=86400, must-revalidate'); // 24h cache with validation
    result.stream.pipe(res);
  } catch (err) {
    console.error('[S3 PROXY] Image fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

app.get('/uploads/documents/*', async (req, res) => {
  try {
    const relativePath = req.params[0];
    if (!relativePath) return res.status(400).json({ error: 'File path required' });

    const s3Key = s3.buildFullS3Key('documents', relativePath);
    const result = await s3.getFromS3(s3Key);

    if (!result) return res.status(404).json({ error: 'Document not found' });

    // HTTP Caching validation (Conditional GET)
    const clientETag = req.headers['if-none-match'];
    if (clientETag && result.etag && clientETag === result.etag) {
      return res.status(304).end();
    }
    const clientModSince = req.headers['if-modified-since'];
    if (clientModSince && result.lastModified) {
      const clientDate = new Date(clientModSince);
      const serverDate = new Date(result.lastModified);
      if (Math.floor(serverDate.getTime() / 1000) <= Math.floor(clientDate.getTime() / 1000)) {
        return res.status(304).end();
      }
    }

    res.set('Content-Type', result.contentType);
    if (result.contentLength) res.set('Content-Length', String(result.contentLength));
    if (result.etag) res.set('ETag', result.etag);
    if (result.lastModified) res.set('Last-Modified', new Date(result.lastModified).toUTCString());
    res.set('Cache-Control', 'public, max-age=86400, must-revalidate'); // 24h cache with validation

    const filename = path.basename(relativePath);
    const ext = path.extname(filename).toLowerCase();
    if (ext !== '.pdf') {
      res.set('Content-Disposition', `attachment; filename="${filename}"`);
    }
    result.stream.pipe(res);
  } catch (err) {
    console.error('[S3 PROXY] Document fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// ── Protected Routes (Entra ID Authenticated) ───────────
const { aadAuthMiddleware } = require('../../shared/aadAuth');

app.use('/api/tickets',  aadAuthMiddleware, require('./routes/tickets'));
app.use('/api/access',   aadAuthMiddleware, require('./routes/access'));
app.use('/api/projects', aadAuthMiddleware, require('./routes/projects'));
app.use('/api/audit',    aadAuthMiddleware, require('./routes/audit'));
app.use('/api/feedback', aadAuthMiddleware, require('./routes/feedback'));
app.use('/api/teams',    aadAuthMiddleware, require('./routes/teams'));

// ── Internal endpoint — intake backend notifies on edit submission ───
app.post('/api/internal/edit-submitted', async (req, res) => {
  const db = require('./db');
  const { nowIST } = require('./ist_time');
  try {
    const { project_id, team_name, user_email, version, change_summary, feedback_id } = req.body;
    
    // Write audit log with change summary
    await db.query(`
      INSERT INTO audit_log (entity_id, entity_type, user_email, action, detail, timestamp)
      VALUES ($1, 'project', $2, 'edit_resubmitted', $3, $4)
    `, [project_id, user_email || 'user', `Team: ${team_name} | Version: ${version} | Changes: ${change_summary}`, nowIST()]);

    console.log(`[EDIT] Project #${project_id} resubmitted by ${user_email} — ${change_summary}`);
    
    res.json({ success: true });
  } catch (err) {
    console.error('[internal] edit-submitted error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Health check ────────────────────────────────────────
const adminStartTime = Date.now();
app.get('/api/health', async (req, res) => {
  const db = require('./db');
  let dbStatus = 'unknown';
  let poolStats = {};
  try {
    await db.query('SELECT 1');
    dbStatus = 'connected';
  } catch (e) {
    dbStatus = `error: ${e.message}`;
  }
  try {
    poolStats = {
      totalCount: db.totalCount,
      idleCount: db.idleCount,
      waitingCount: db.waitingCount,
    };
  } catch (_) {}
  const mem = process.memoryUsage();
  res.json({
    status: 'healthy',
    service: 'Admin Backend',
    port: process.env.ADMIN_BACKEND_PORT || 3001,
    uptime: Math.floor((Date.now() - adminStartTime) / 1000),
    timestamp: new Date().toISOString(),
    database: dbStatus,
    pool: poolStats,
    memory: {
      rss: `${(mem.rss / 1048576).toFixed(1)} MB`,
      heapUsed: `${(mem.heapUsed / 1048576).toFixed(1)} MB`,
      heapTotal: `${(mem.heapTotal / 1048576).toFixed(1)} MB`,
      external: `${(mem.external / 1048576).toFixed(1)} MB`,
    },
  });
});

// ── Global Express error handler (safety net) ──────────────
app.use((err, req, res, next) => {
  console.error('[EXPRESS ERROR]', err.message, err.stack);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Memory monitoring (every 60 seconds) ───────────────
setInterval(() => {
  const mem = process.memoryUsage();
  console.log(
    `[MEMORY] Admin Backend — RSS: ${(mem.rss / 1048576).toFixed(1)} MB | ` +
    `Heap Used: ${(mem.heapUsed / 1048576).toFixed(1)} MB | ` +
    `Heap Total: ${(mem.heapTotal / 1048576).toFixed(1)} MB | ` +
    `External: ${(mem.external / 1048576).toFixed(1)} MB`
  );
  try {
    const db = require('./db');
    console.log(
      `[DB POOL] Admin Backend — Total: ${db.totalCount} | Idle: ${db.idleCount} | Waiting: ${db.waitingCount}`
    );
  } catch (_) {}
}, 60000);

// ── Start ────────────────────────────────────────────────
const PORT = process.env.ADMIN_BACKEND_PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

async function bootstrap() {
  const server = app.listen(PORT, HOST, async () => {
    console.log('[INFO] Admin Backend started successfully.');

    try {
      // Validate S3 configuration
      s3.validateConfig();
      // Verify S3 credentials asynchronously
      await s3.verifyCredentials();
    } catch (err) {
      console.error('[FATAL] S3 initialization failed:', err.message);
      process.exit(1);
    }
  });

  server.on('error', (err) => {
    console.error('[FATAL] Express server failed to start:', err.message);
    process.exit(1);
  });
}

bootstrap();
