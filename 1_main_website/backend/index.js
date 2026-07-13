require('dotenv').config({ path: require('path').resolve(__dirname, '..', '..', '.env') });
const express = require('express');
const cors = require('cors');
const axios = require('axios');

// ── Process-level error handlers — prevent crashes ─────────
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.message, err.stack);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Promise Rejection:', reason);
});
const { usersPool } = require('./db');
const { nowIST } = require('./ist_time');

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Request timing middleware ──────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const line = `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`;
    if (duration > 1000) {
      console.warn(`[SLOW REQUEST] ${line}`);
    }
  });
  next();
});

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/published-projects', require('./routes/projects'));
app.use('/api/chat', require('./routes/chat'));

// ── DASHBOARDS DATA (for access control) ───────────────────
const DASHBOARDS = {
  sales_global: {
    name: 'Global Sales Overview',
    required_role: 'sales_viewer',
    url: 'https://powerbi.microsoft.com/r/sales_report_123',
  },
  finance_pnl: {
    name: 'Q3 P&L Statement',
    required_role: 'finance_viewer',
    url: 'https://tableau.server.com/finance/pnl_q3',
  },
  hr_attrition: {
    name: 'Global Attrition Dashboard',
    required_role: 'hr_viewer',
    url: 'https://powerbi.microsoft.com/r/hr_demo',
  },
};

// ── Dashboard Access Control ───────────────────────────────
app.post('/api/validate-access', async (req, res) => {
  try {
    // 1. Security Check (API Key)
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== 'my-secret-key') {
      return res.status(401).json({ error: 'Unauthorized System Call' });
    }

    // 2. Parse Request
    const { user_id, dashboard_id } = req.body;
    if (!user_id || !dashboard_id) {
      return res.status(400).json({ error: 'Missing user_id or dashboard_id' });
    }

    // 3. Retrieve User from Database
    const { rows } = await usersPool.query(
      'SELECT * FROM users WHERE user_id = $1',
      [user_id]
    );
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userRoles = user.roles
      ? user.roles.split(',').map((r) => r.trim())
      : [];
    const dashboard = DASHBOARDS[dashboard_id];
    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    // 4. Authorization Logic
    const requiredRole = dashboard.required_role;
    if (userRoles.includes(requiredRole) || userRoles.includes('admin')) {
      console.log(`[ACCESS] ALLOW - User: ${user_id} | Dashboard: ${dashboard_id}`);
      return res.json({
        status: 'ALLOW',
        redirect_url: dashboard.url,
        message: 'Access Granted',
        user_roles_detected: userRoles,
      });
    } else {
      console.log(`[ACCESS] DENY - User: ${user_id} | Dashboard: ${dashboard_id}`);
      return res.json({
        status: 'DENY',
        message: `User does not have required role: ${requiredRole}`,
        request_access_url: `/request-access?id=${dashboard_id}`,
      });
    }
  } catch (err) {
    console.error('[ERROR] Validate access failed:', err.message);
    return res.status(500).json({ error: 'Access validation failed', details: err.message });
  }
});

// ── Admin Proxy Endpoints ──────────────────────────────────

app.post('/api/feedback', async (req, res) => {
  try {
    const resp = await axios.post('http://localhost:3001/api/feedback', req.body, { timeout: 10000 });
    return res.status(resp.status).json(resp.data);
  } catch (err) {
    console.error('[ERROR] Proxy feedback failed:', err.message);
    return res.status(500).json({ error: 'Feedback proxy failed', details: err.message });
  }
});

app.get('/api/teams', async (req, res) => {
  try {
    const resp = await axios.get('http://localhost:3001/api/teams', { timeout: 10000 });
    return res.status(resp.status).json(resp.data);
  } catch (err) {
    console.error('[ERROR] Proxy teams failed:', err.message);
    return res.status(500).json({ error: 'Teams proxy failed', details: err.message });
  }
});

app.get('/api/teams/:team_name/projects', async (req, res) => {
  try {
    const resp = await axios.get(
      `http://localhost:3001/api/teams/${encodeURIComponent(req.params.team_name)}/projects`,
      { timeout: 10000 }
    );
    return res.status(resp.status).json(resp.data);
  } catch (err) {
    console.error('[ERROR] Proxy team projects failed:', err.message);
    return res.status(500).json({ error: 'Team projects proxy failed', details: err.message });
  }
});

app.post('/api/internal/refresh-published', async (req, res) => {
  try {
    const { adminPool } = require('./db');
    const { rows } = await adminPool.query(`
      SELECT pp.published_id
      FROM   published_projects pp
    `);
    return res.json({
      status: 'success',
      message: 'Published projects refreshed',
      count: rows.length,
    });
  } catch (err) {
    console.error('[ERROR] Refresh published failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── Health Check ─────────────────────────────────────────
const mainStartTime = Date.now();
app.get('/api/health', async (req, res) => {
  let dbStatus = 'unknown';
  let poolStats = {};
  try {
    const { rows } = await usersPool.query('SELECT COUNT(*) AS cnt FROM users');
    dbStatus = 'connected';
    poolStats = {
      totalCount: usersPool.totalCount,
      idleCount: usersPool.idleCount,
      waitingCount: usersPool.waitingCount,
    };
  } catch (e) {
    dbStatus = `error: ${e.message}`;
  }
  const mem = process.memoryUsage();
  res.json({
    status: 'healthy',
    service: 'Main Website Backend',
    port: process.env.MAIN_BACKEND_PORT || 3000,
    uptime: Math.floor((Date.now() - mainStartTime) / 1000),
    timestamp: new Date().toISOString(),
    database: {
      schema: 'is_adm_india',
      status: dbStatus,
    },
    pool: poolStats,
    memory: {
      rss: `${(mem.rss / 1048576).toFixed(1)} MB`,
      heapUsed: `${(mem.heapUsed / 1048576).toFixed(1)} MB`,
      heapTotal: `${(mem.heapTotal / 1048576).toFixed(1)} MB`,
      external: `${(mem.external / 1048576).toFixed(1)} MB`,
    },
  });
});

// ── Root Endpoint ──────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'ADM Backend Service',
    version: '3.0',
    endpoints: {
      health: '/api/health',
      auth: {
        register: '/api/auth/register',
        login: '/api/auth/login',
        user: '/api/auth/user/:user_id',
      },
      dashboard: {
        validate_access: '/api/validate-access',
      },
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
    `[MEMORY] Main Backend — RSS: ${(mem.rss / 1048576).toFixed(1)} MB | ` +
    `Heap Used: ${(mem.heapUsed / 1048576).toFixed(1)} MB | ` +
    `Heap Total: ${(mem.heapTotal / 1048576).toFixed(1)} MB | ` +
    `External: ${(mem.external / 1048576).toFixed(1)} MB`
  );
  try {
    console.log(
      `[DB POOL] Main Backend — Total: ${usersPool.totalCount} | Idle: ${usersPool.idleCount} | Waiting: ${usersPool.waitingCount}`
    );
  } catch (_) {}
}, 60000);

// ── Start Server ───────────────────────────────────────────
const PORT = process.env.MAIN_BACKEND_PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log('[INFO] Main Backend started successfully.');
});
