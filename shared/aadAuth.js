// =============================================================================
// shared/aadAuth.js
// Mock Token Verification Middleware (SSO Removed)
// =============================================================================

/**
 * Mock claims resolver for the removed Microsoft Entra ID Token verification.
 * Always resolves to the local administrator claims.
 */
function validateAADToken(token) {
  return Promise.resolve({
    oid: 'mock-oid-admin',
    preferred_username: 'admin@adm.com',
    name: 'Local Admin',
    tid: 'mock-tid',
  });
}

/**
 * Express Middleware to mock authentication on protected API routes.
 * Automatically attaches local administrator claims to req.user.
 */
async function aadAuthMiddleware(req, res, next) {
  req.user = {
    oid: 'mock-oid-admin',
    email: 'admin@adm.com',
    name: 'Local Admin',
    tid: 'mock-tid',
  };
  next();
}

module.exports = {
  validateAADToken,
  aadAuthMiddleware,
};
