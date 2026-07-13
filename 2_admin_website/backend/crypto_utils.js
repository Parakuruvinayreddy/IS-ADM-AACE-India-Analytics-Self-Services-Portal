/**
 * Token Encryption Utilities
 * Uses AES-256-GCM to encrypt/decrypt access tokens for URL safety.
 * Prevents raw UUID tokens from being exposed in URLs and emails.
 */
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;    // GCM standard IV length
const TAG_LENGTH = 16;   // GCM auth tag length

/**
 * Get or generate the encryption key.
 * Key must be 32 bytes (256 bits) for AES-256.
 */
function getKey() {
  let key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    // Auto-generate a key if not set (dev convenience — log a warning)
    console.warn('[crypto] TOKEN_ENCRYPTION_KEY not set — generating ephemeral key. Set it in .env for persistence!');
    key = crypto.randomBytes(32).toString('hex');
    process.env.TOKEN_ENCRYPTION_KEY = key;
  }
  // Key is stored as hex (64 chars = 32 bytes)
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a plaintext token (UUID) into a URL-safe base64 string.
 * Format: base64url( IV + ciphertext + authTag )
 * @param {string} plainToken - The UUID token to encrypt
 * @returns {string} URL-safe encrypted string
 */
function encryptToken(plainToken) {
  const key = getKey();
  // Generate a deterministic IV using a SHA-256 hash of the plain token
  const iv = crypto.createHash('sha256').update(plainToken).digest().subarray(0, IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainToken, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const tag = cipher.getAuthTag();

  // Combine: IV (12) + encrypted + tag (16)
  const combined = Buffer.concat([iv, encrypted, tag]);

  // Return URL-safe base64 (no padding, replace +/ with -_)
  return combined.toString('base64url');
}

/**
 * Decrypt an encrypted token back to the original UUID.
 * @param {string} encryptedToken - URL-safe base64 encrypted token
 * @returns {string|null} The original UUID, or null if decryption fails
 */
function decryptToken(encryptedToken) {
  try {
    const key = getKey();
    const combined = Buffer.from(encryptedToken, 'base64url');

    if (combined.length < IV_LENGTH + TAG_LENGTH + 1) {
      return null; // Too short to be a valid encrypted token
    }

    const iv = combined.subarray(0, IV_LENGTH);
    const tag = combined.subarray(combined.length - TAG_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH, combined.length - TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext, null, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    // Decryption failed — likely a legacy plain UUID or tampered token
    return null;
  }
}

/**
 * Resolve a token from a request — try decryption first, fall back to plain UUID.
 * This provides backward compatibility with old-style plain tokens.
 * @param {string} token - The token from the URL (may be encrypted or plain UUID)
 * @returns {string} The resolved plain UUID token for DB lookup
 */
function resolveToken(token) {
  if (!token) return token;

  // Try to decrypt first
  const decrypted = decryptToken(token);
  if (decrypted) {
    return decrypted;
  }

  // If decryption fails, check if it looks like a raw UUID (backward compat)
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (UUID_REGEX.test(token)) {
    return token;
  }

  // Neither encrypted nor valid UUID — return as-is, will fail DB lookup
  return token;
}

module.exports = { encryptToken, decryptToken, resolveToken };
