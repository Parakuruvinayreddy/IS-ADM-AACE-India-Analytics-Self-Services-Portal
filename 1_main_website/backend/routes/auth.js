const express = require('express');
const { usersPool } = require('../db');
const { nowIST } = require('../ist_time');
const { validateAADToken } = require('../../../shared/aadAuth');

const router = express.Router();

// Helper: serialize a user row to the frontend-expected shape
function userToDict(user) {
  return {
    user_id: user.user_id,
    email: user.email,
    name: user.name,
    org: user.org,
    location: user.location,
    roles: user.roles ? user.roles.split(',').map((r) => r.trim()) : [],
    created_at: user.created_at ? new Date(user.created_at).toISOString() : null,
  };
}

// POST /api/auth/aad-login
// Validates Entra ID JWT and provisions/updates PG database user profile
router.post('/aad-login', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    let email, name, oid, tid;
    if (token === 'mock-developer-token') {
      email = 'admin@adm.com';
      name = 'Local Admin';
      oid = 'mock-oid-admin';
      tid = 'mock-tid';
    } else {
      // Validate Microsoft Entra ID Token
      const claims = await validateAADToken(token);
      email = claims.preferred_username || claims.email;
      name = claims.name;
      oid = claims.oid; // Microsoft Object ID
      tid = claims.tid; // Tenant ID
    }

    if (!oid || !email) {
      return res.status(400).json({ error: 'Invalid token claims: oid and email are required' });
    }

    // Lookup user in PostgreSQL database using Microsoft Object ID (azure_oid)
    let userResult = await usersPool.query('SELECT * FROM users WHERE azure_oid = $1', [oid]);
    let user = userResult.rows[0];

    if (!user) {
      // Check for a legacy user account that has the same email but no azure_oid yet
      const legacyResult = await usersPool.query('SELECT * FROM users WHERE email = $1', [email]);
      const legacyUser = legacyResult.rows[0];

      if (legacyUser) {
        // Update the existing legacy account with the user's AD parameters and clear the password hash
        const roles = token === 'mock-developer-token' ? 'admin,public' : (legacyUser.roles || 'public');
        const updateResult = await usersPool.query(
          `UPDATE users 
           SET azure_oid = $1, azure_tid = $2, password_hash = NULL, name = $3, roles = $4
           WHERE user_id = $5
           RETURNING *`,
          [oid, tid, name, roles, legacyUser.user_id]
        );
        user = updateResult.rows[0];
        console.log(`[AUTH] Linked legacy user account: ${legacyUser.user_id} to AAD oid: ${oid}`);
      } else {
        // Just-in-Time (JIT) Provisioning: Create a brand new user
        // We use the AAD Object ID (oid) as the local user_id for new users.
        const roles = token === 'mock-developer-token' ? 'admin,public' : 'public';
        const insertResult = await usersPool.query(
          `INSERT INTO users (user_id, email, password_hash, name, org, location, roles, azure_oid, azure_tid, created_at)
           VALUES ($1, $2, NULL, $3, 'ADM', 'Remote', $4, $1, $5, $6)
           RETURNING *`,
          [oid, email, name, roles, tid, nowIST()]
        );
        user = insertResult.rows[0];
        console.log(`[AUTH] Provisioned new user profile: ${email} (oid: ${oid})`);
      }
    } else {
      // For mock developer login, ensure the user has the admin role if they don't already
      if (token === 'mock-developer-token') {
        const currentRoles = user.roles ? user.roles.split(',').map(r => r.trim()) : [];
        if (!currentRoles.includes('admin')) {
          const updatedRoles = [...new Set([...currentRoles, 'admin', 'public'])].join(',');
          await usersPool.query('UPDATE users SET roles = $1 WHERE user_id = $2', [updatedRoles, user.user_id]);
          user.roles = updatedRoles;
        }
      }
      // Sync claims dynamically on returning login if name or email changed in AD
      if (user.name !== name || user.email !== email) {
        const syncResult = await usersPool.query(
          `UPDATE users SET email = $1, name = $2 WHERE azure_oid = $3 RETURNING *`,
          [email, name, oid]
        );
        user = syncResult.rows[0];
        console.log(`[AUTH] Synchronized user name/email claims for AD identity: ${oid}`);
      }
    }

    return res.status(200).json({
      status: 'success',
      user: userToDict(user),
    });
  } catch (err) {
    console.error('[ERROR] AAD Login / JIT Sync failed:', err.message);
    return res.status(401).json({ error: 'Authentication failed', details: err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  GET /api/auth/user/:user_id
// ════════════════════════════════════════════════════════════

router.get('/user/:user_id', async (req, res) => {
  try {
    const { rows } = await usersPool.query('SELECT * FROM users WHERE user_id = $1', [
      req.params.user_id,
    ]);
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      status: 'success',
      user: userToDict(user),
    });
  } catch (err) {
    console.error('[ERROR] Get user failed:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve user', details: err.message });
  }
});

// ════════════════════════════════════════════════════════════
//  Seed default admin user on startup
// ════════════════════════════════════════════════════════════

(async () => {
  try {
    // Ensure users table exists
    await usersPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id       VARCHAR(50) PRIMARY KEY,
        email         VARCHAR(120) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NULL,
        name          VARCHAR(100) NOT NULL,
        org           VARCHAR(100) NOT NULL,
        location      VARCHAR(100) NOT NULL,
        roles         VARCHAR(500) DEFAULT 'public',
        azure_oid     VARCHAR(100) UNIQUE NULL,
        azure_tid     VARCHAR(100) NULL,
        created_at    TIMESTAMP DEFAULT NOW()
      )
    `);

    // Ensure access_requests table exists
    await usersPool.query(`
      CREATE TABLE IF NOT EXISTS access_requests (
        id             SERIAL PRIMARY KEY,
        user_id        VARCHAR(50) REFERENCES users(user_id),
        dashboard_id   VARCHAR(100) NOT NULL,
        resource_type  VARCHAR(50) NOT NULL,
        project_name   VARCHAR(200),
        justification  TEXT NOT NULL,
        status         VARCHAR(20) DEFAULT 'pending',
        requested_at   TIMESTAMP DEFAULT NOW(),
        reviewed_at    TIMESTAMP,
        reviewed_by    VARCHAR(50),
        admin_notes    TEXT
      )
    `);

    // Ensure api_keys table exists
    await usersPool.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id           SERIAL PRIMARY KEY,
        user_id      VARCHAR(50) REFERENCES users(user_id),
        key_value    VARCHAR(255) UNIQUE NOT NULL,
        dashboard_id VARCHAR(100) NOT NULL,
        created_at   TIMESTAMP DEFAULT NOW(),
        expires_at   TIMESTAMP,
        is_active    BOOLEAN DEFAULT TRUE,
        last_used    TIMESTAMP
      )
    `);

    console.log('[OK] Database tables verified (is_adm_india)');

    // Admin seeding is disabled for Microsoft Entra ID. Administrative accounts
    // must be provisioned via corporate SSO and group mappings.
  } catch (err) {
    console.error('[DB] Init error:', err.message);
  }
})();

module.exports = router;
