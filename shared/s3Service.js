// ════════════════════════════════════════════════════════════════════════════
//  shared/s3Service.js — Amazon S3 Utility Service (AWS SDK v3)
//
//  Central module for all S3 operations across the ADM Analytics Platform.
//  Used by: Intake Backend (Module 3), Admin Backend (Module 2)
//
//  Authentication: AWS Access Key + Secret Key from environment variables.
//  Migration to IAM Roles (ECS): Simply remove the `credentials` block
//  from the S3Client constructor — the SDK will auto-detect IAM role creds.
//  No controller, service, API, or database logic needs to change.
//
//  Configuration: 100% driven by environment variables.
//  Nothing AWS-related is hardcoded. Changing bucket, region, folder prefix,
//  file size limits, retry count, or allowed types only requires updating .env.
// ════════════════════════════════════════════════════════════════════════════

// Lazy-load AWS SDK and related dependencies from the backend node_modules.
const path = require('path');

function resolveModule(moduleName) {
  try {
    return require(moduleName);
  } catch (_) {
    const { createRequire } = require('module');
    const paths = [
      path.resolve(__dirname, '..', '2_admin_website', 'backend', 'index.js'),
      path.resolve(__dirname, '..', '3_intake_page', 'backend', 'index.js'),
      require.main?.filename,
      process.cwd() + '/index.js'
    ].filter(Boolean);

    for (const p of paths) {
      try {
        const mainRequire = createRequire(p);
        const mod = mainRequire(moduleName);
        if (mod) return mod;
      } catch (err) {
        // try next path
      }
    }
  }
  throw new Error(`Cannot find module '${moduleName}' in any of the backend node_modules paths.`);
}

let _awsSdk = null;
function getAwsSdk() {
  if (_awsSdk) return _awsSdk;
  _awsSdk = resolveModule('@aws-sdk/client-s3');
  return _awsSdk;
}

let _nodeHttpHandler = null;
function getNodeHttpHandler() {
  if (_nodeHttpHandler) return _nodeHttpHandler;
  _nodeHttpHandler = resolveModule('@smithy/node-http-handler');
  return _nodeHttpHandler;
}

let _httpsProxyAgent = null;
function getHttpsProxyAgent() {
  if (_httpsProxyAgent) return _httpsProxyAgent;
  try {
    const mod = resolveModule('https-proxy-agent');
    _httpsProxyAgent = mod.HttpsProxyAgent || mod;
  } catch (e) {
    // not installed in all backends
  }
  return _httpsProxyAgent;
}

// ── S3 Availability tracking ─────────────────────────────────────────────
let S3_AVAILABLE = false;

function setS3Available(val) {
  const oldVal = S3_AVAILABLE;
  S3_AVAILABLE = !!val;
  if (oldVal !== S3_AVAILABLE) {
    console.log(`[S3 SERVICE] S3_AVAILABLE state transition: ${oldVal} -> ${S3_AVAILABLE}`);
  }
}

function getS3Available() {
  return S3_AVAILABLE;
}

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 1: CONFIGURATION (all from environment variables)
// ═══════════════════════════════════════════════════════════════════════════

// Required env vars — application MUST NOT start without these
const REQUIRED_ENV_VARS = [
  'AWS_REGION',
  'AWS_BUCKET_NAME',
  'AWS_FOLDER_PREFIX',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
];

/**
 * Read a configurable integer from env with a fallback default.
 */
function envInt(key, defaultValue) {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return defaultValue;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Read a configurable comma-separated list from env with a fallback default.
 */
function envList(key, defaultValue) {
  const raw = process.env[key];
  if (!raw || !raw.trim()) return defaultValue;
  return raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

// ── Configurable limits (override via .env) ─────────────────────────────
function getMaxImageSize()    { return envInt('AWS_MAX_IMAGE_SIZE_MB', 10) * 1024 * 1024; }
function getMaxDocumentSize() { return envInt('AWS_MAX_DOCUMENT_SIZE_MB', 25) * 1024 * 1024; }
function getRetryCount()      { return envInt('AWS_UPLOAD_RETRY_COUNT', 3); }

// ── Configurable allowed file types (override via .env) ─────────────────
function getAllowedImageExtensions() {
  return envList('AWS_ALLOWED_IMAGE_TYPES', ['.png', '.jpg', '.jpeg', '.svg']);
}
function getAllowedDocumentExtensions() {
  return envList('AWS_ALLOWED_DOCUMENT_TYPES', ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx']);
}

function getBucketName()   { return process.env.AWS_BUCKET_NAME; }
function getFolderPrefix() { return process.env.AWS_FOLDER_PREFIX; }

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 2: STARTUP VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate that all required AWS environment variables are set.
 * If any are missing, logs a descriptive error and terminates the process.
 * Call this during application startup BEFORE serving requests.
 */
function validateConfig() {
  const missing = REQUIRED_ENV_VARS.filter(key => !process.env[key] || !process.env[key].trim());
  const accessKey = process.env.AWS_ACCESS_KEY_ID || '';
  let stsTokenMissing = false;

  if (accessKey.startsWith('ASIA')) {
    if (!process.env.AWS_SESSION_TOKEN || !process.env.AWS_SESSION_TOKEN.trim()) {
      stsTokenMissing = true;
    }
  }

  if (missing.length > 0 || stsTokenMissing) {
    console.error('');
    console.error('╔══════════════════════════════════════════════════════════════╗');
    console.error('║  [S3 SERVICE] FATAL — Missing required environment variables ║');
    console.error('╚══════════════════════════════════════════════════════════════╝');
    console.error('');
    missing.forEach(key => {
      console.error(`  ✗  ${key} is not set`);
    });
    if (stsTokenMissing) {
      console.error('  ✗  AWS_SESSION_TOKEN is not set');
      console.error('     (Required when AWS_ACCESS_KEY_ID starts with "ASIA" for temporary STS credentials)');
    }
    console.error('');
    console.error('  Please set these variables in the .env file and restart.');
    console.error('  The application cannot start without valid AWS configuration.');
    console.error('');
    process.exit(1);
  }

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  [S3 SERVICE] Startup Configuration Validation               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`  Storage Provider:          Amazon S3`);
  console.log(`  AWS Region:                ${process.env.AWS_REGION}`);
  console.log(`  Bucket Name:               ${process.env.AWS_BUCKET_NAME}`);
  console.log(`  Folder Prefix:             ${process.env.AWS_FOLDER_PREFIX}`);
  console.log(`  Endpoint URL:              https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`);
  console.log(`  Connection Timeout:        ${envInt('AWS_CONNECTION_TIMEOUT', 15000)} ms`);
  console.log(`  Upload Retry Count:        ${getRetryCount()}`);
  console.log(`  Startup Validation Status: SUCCESS`);
  console.log('');
}

/**
 * Test DNS and HTTP connectivity to the S3 bucket.
 */
async function testBucketConnectivity() {
  const dns = require('dns').promises;
  const https = require('https');
  const bucket = getBucketName();
  const region = process.env.AWS_REGION;
  const host = `${bucket}.s3.${region}.amazonaws.com`;

  let proxyUrl = process.env.HTTPS_PROXY || process.env.http_proxy || process.env.https_proxy || process.env.HTTP_PROXY;
  if (!proxyUrl && (process.env.USERDNSDOMAIN === 'TYCOELECTRONICS.COM' || process.env.USERDOMAIN === 'TYCOELECTRONICS')) {
    proxyUrl = 'http://127.0.0.1:9000';
  }

  const HttpsProxyAgent = getHttpsProxyAgent();
  const agent = (proxyUrl && HttpsProxyAgent) ? new HttpsProxyAgent(proxyUrl) : undefined;

  // 1. DNS Resolution (only if not using a proxy, as proxies resolve DNS server-side)
  if (!agent) {
    const dnsStart = Date.now();
    try {
      const addresses = await dns.lookup(host);
      const dnsDuration = Date.now() - dnsStart;
      console.log(`  ✓ DNS Resolution: Resolved to ${addresses.address} in ${dnsDuration}ms`);
    } catch (err) {
      const dnsDuration = Date.now() - dnsStart;
      console.error(`  ✗ DNS Resolution: Failed to resolve ${host} after ${dnsDuration}ms. Error: ${err.message} (${err.code})`);
      return { success: false, phase: 'DNS', error: err };
    }
  } else {
    // If routing through local proxy (e.g. Zscaler), the proxy resolves external DNS for us.
  }

  // 2. HTTPS Connection
  const connStart = Date.now();
  try {
    await new Promise((resolve, reject) => {
      const requestOptions = {
        host,
        port: 443,
        method: 'HEAD',
        path: '/',
        timeout: 5000,
      };
      if (agent) {
        requestOptions.agent = agent;
      }
      const req = https.request(requestOptions, (res) => {
        resolve();
      });
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Connection timed out'));
      });
      req.end();
    });
    const connDuration = Date.now() - connStart;
    console.log(`  ✓ HTTPS Connection: Established connection to S3 endpoint in ${connDuration}ms`);
  } catch (err) {
    const connDuration = Date.now() - connStart;
    console.error(`  ✗ HTTPS Connection: Failed to connect to S3 endpoint after ${connDuration}ms. Error: ${err.message}`);
    return { success: false, phase: 'HTTPS', error: err };
  }

  return { success: true };
}

/**
 * Classify S3 errors into transient or fatal.
 */
function classifyS3Error(err) {
  const name = err.name || err.code;
  const message = err.message || '';
  const httpStatus = err.$metadata?.httpStatusCode;

  const fatalErrors = [
    'InvalidAccessKeyId',
    'SignatureDoesNotMatch',
    'AccessDenied',
    'NoSuchBucket',
    'InvalidRegion',
    'InvalidSignatureException',
    'Forbidden',
    'NotFound'
  ];

  if (fatalErrors.includes(name) || fatalErrors.includes(message)) {
    return 'fatal';
  }

  if (httpStatus === 403 || httpStatus === 404) {
    return 'fatal';
  }

  const transientErrors = [
    'TimeoutError',
    'ETIMEDOUT',
    'ECONNRESET',
    'ENOTFOUND',
    'EAI_AGAIN',
    'NetworkingError',
    'RequestTimeout',
    'SlowDown'
  ];

  if (transientErrors.includes(name) || transientErrors.includes(err.code) || message.includes('Timeout') || message.includes('timeout')) {
    return 'transient';
  }

  if (err.code && (err.code.startsWith('E') || err.code === 'DNS')) {
    return 'transient';
  }

  return 'transient';
}

/**
 * Log fatal errors clearly and exit.
 */
function handleFatalError(err, bucket, region) {
  console.error('');
  console.error('╔═══════════════════════════════════════════════════════════╗');
  console.error('║  [S3 SERVICE] FATAL — AWS S3 configuration / auth failed  ║');
  console.error('╚═══════════════════════════════════════════════════════════╝');
  console.error('');

  if (err.name === 'InvalidRegion') {
    console.error(`  ✗  AWS Region Mismatch detected.`);
    console.error(`     Please correct AWS_REGION in your .env file and restart.`);
  } else if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
    console.error(`  ✗  Bucket "${bucket}" does not exist in region "${region}".`);
  } else if (err.name === 'Forbidden' || err.$metadata?.httpStatusCode === 403) {
    console.error(`  ✗  Access denied to bucket "${bucket}".`);
    console.error('     Check that AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are correct');
    console.error('     and the IAM user has permissions on this bucket.');
  } else {
    console.error(`  ✗  ${err.name || 'Error'}: ${err.message}`);
  }
  console.error('');
  console.error('  The application cannot start without valid AWS credentials.');
  console.error('');
  process.exit(1);
}

/**
 * Periodic background checker when S3 is unavailable or status recovery is needed.
 */
let backgroundCheckInterval = null;

function startBackgroundHealthCheck() {
  if (backgroundCheckInterval) return;

  const intervalMs = envInt('AWS_HEALTHCHECK_INTERVAL_MS', 30000);
  console.log(`[S3 SERVICE] Starting background S3 health check interval (every ${intervalMs}ms)...`);

  backgroundCheckInterval = setInterval(async () => {
    try {
      const sdk = getAwsSdk();
      const client = getS3Client();
      const bucket = getBucketName();
      await client.send(new sdk.HeadBucketCommand({ Bucket: bucket }));

      if (!S3_AVAILABLE) {
        console.log('[INFO] Amazon S3 connectivity restored.');
        setS3Available(true);
      }
    } catch (err) {
      if (S3_AVAILABLE) {
        console.warn('╔═══════════════════════════════════════════════════════════╗');
        console.warn('║  [S3 SERVICE] S3 storage became unavailable!              ║');
        console.warn('║  S3_AVAILABLE: true -> false                              ║');
        console.warn('╚═══════════════════════════════════════════════════════════╝');
        setS3Available(false);
      }
    }
  }, intervalMs);

  if (backgroundCheckInterval.unref) {
    backgroundCheckInterval.unref();
  }
}

/**
 * Verify AWS credentials by performing a lightweight HeadBucket call.
 * If credentials are invalid or the bucket is inaccessible, logs a
 * descriptive error and terminates the process.
 *
 * Call this AFTER validateConfig() during application startup.
 * This is an async operation — use `await` or `.then()`.
 */
async function verifyCredentials() {
  const sdk = getAwsSdk();
  const client = getS3Client();
  const bucket = getBucketName();
  const region = process.env.AWS_REGION;

  console.log(`[S3 SERVICE] Initiating AWS credentials and bucket accessibility check...`);

  const endpoint = `https://${bucket}.s3.${region}.amazonaws.com`;
  console.log('---------------------------------------------------------');
  console.log(`  AWS Region:          ${region}`);
  console.log(`  Bucket Name:         ${bucket}`);
  console.log(`  Folder Prefix:       ${process.env.AWS_FOLDER_PREFIX}`);
  console.log(`  Endpoint:            ${endpoint}`);
  console.log('---------------------------------------------------------');

  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[S3 SERVICE] Verification Attempt: ${attempt}/${maxRetries}`);
    try {
      if (attempt === 1) {
        const connTest = await testBucketConnectivity();
        if (!connTest.success) {
          throw connTest.error;
        }
      }

      const startTime = Date.now();
      const headRes = await client.send(new sdk.HeadBucketCommand({ Bucket: bucket }));
      const duration = Date.now() - startTime;

      const actualRegion = headRes.$metadata?.headers?.['x-amz-bucket-region'] || headRes.BucketRegion;

      if (actualRegion && actualRegion.toLowerCase() !== region.toLowerCase()) {
        const mismatchErr = new Error(`RegionMismatch: Configured AWS_REGION is "${region}" but bucket is in "${actualRegion}".`);
        mismatchErr.name = 'InvalidRegion';
        throw mismatchErr;
      }

      console.log('[INFO] Amazon S3 verification succeeded.');
      setS3Available(true);

      const isProduction = process.env.NODE_ENV === 'production';
      const runWriteCheck = !isProduction || process.env.AWS_RUN_WRITE_HEALTHCHECK === 'true';

      if (runWriteCheck) {
        const testKey = `${getFolderPrefix()}/.startup-healthcheck-${Date.now()}.txt`;
        try {
          // 1. Put object
          await client.send(new sdk.PutObjectCommand({
            Bucket: bucket,
            Key: testKey,
            Body: 'healthcheck-test-data',
            ContentType: 'text/plain',
          }));

          // 2. Get object
          await client.send(new sdk.GetObjectCommand({
            Bucket: bucket,
            Key: testKey,
          }));

          // 3. Delete object
          await client.send(new sdk.DeleteObjectCommand({
            Bucket: bucket,
            Key: testKey,
          }));

        } catch (writeErr) {
          console.error('[S3 SERVICE] FATAL — S3 Write/Read verification failed');
          throw writeErr;
        }
      }

      startBackgroundHealthCheck();
      return;
    } catch (err) {
      lastError = err;
      const classification = classifyS3Error(err);

      console.error(`[S3 SERVICE] Attempt ${attempt}/${maxRetries} failed with error:`);
      console.error({
        name: err.name || err.code,
        message: err.message,
        code: err.code,
        metadata: err.$metadata,
        statusCode: err.$metadata?.httpStatusCode,
        requestId: err.$metadata?.requestId,
        attempt,
        stack: err.stack
      });

      if (classification === 'fatal') {
        setS3Available(false);
        handleFatalError(err, bucket, region);
        throw err;
      }

      if (attempt < maxRetries) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
        console.log(`[S3 SERVICE] Transient error encountered. Retrying in ${backoffMs}ms...`);
        await sleep(backoffMs);
      }
    }
  }

  setS3Available(false);

  console.warn('[WARN] Amazon S3 temporarily unavailable. Running in read-only mode.');

  startBackgroundHealthCheck();
}

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 3: S3 CLIENT
// ═══════════════════════════════════════════════════════════════════════════

// When migrating to IAM Roles on ECS:
//   1. Remove the `credentials` block below
//   2. Remove AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from .env
//   3. The SDK will automatically use the ECS task role
//   4. No other code changes are required
let _s3Client = null;

function getS3Client() {
  if (_s3Client) return _s3Client;

  const sdk = getAwsSdk();
  const clientConfig = {
    region: process.env.AWS_REGION,
  };

  // Use explicit credentials if provided (Access Key auth)
  // On ECS with IAM Roles: remove this block — SDK auto-detects task role
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    clientConfig.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
    if (process.env.AWS_SESSION_TOKEN) {
      clientConfig.credentials.sessionToken = process.env.AWS_SESSION_TOKEN;
    }
  }

  let proxyUrl = process.env.HTTPS_PROXY || process.env.http_proxy || process.env.https_proxy || process.env.HTTP_PROXY;
  if (!proxyUrl && (process.env.USERDNSDOMAIN === 'TYCOELECTRONICS.COM' || process.env.USERDOMAIN === 'TYCOELECTRONICS')) {
    proxyUrl = 'http://127.0.0.1:9000';
  }

  try {
    const NodeHttpHandler = getNodeHttpHandler().NodeHttpHandler;
    if (NodeHttpHandler) {
      const handlerConfig = {
        connectionTimeout: envInt('AWS_CONNECTION_TIMEOUT', 15000),
        socketTimeout: envInt('AWS_SOCKET_TIMEOUT', 15000),
      };

      if (proxyUrl) {
        const HttpsProxyAgent = getHttpsProxyAgent();
        if (HttpsProxyAgent) {
          const agent = new HttpsProxyAgent(proxyUrl);
          handlerConfig.httpsAgent = agent;
          handlerConfig.httpAgent = agent;
        } else {
          console.warn(`[S3 SERVICE] Proxy URL configured (${proxyUrl}) but 'https-proxy-agent' package is not installed in this backend.`);
        }
      }

      clientConfig.requestHandler = new NodeHttpHandler(handlerConfig);
    }
  } catch (err) {
    console.warn('[S3 SERVICE] Failed to initialize NodeHttpHandler, falling back to default SDK handler:', err.message);
  }

  _s3Client = new sdk.S3Client(clientConfig);
  return _s3Client;
}

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 4: STRUCTURED LOGGING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Produce a structured log line for every S3 operation.
 * Never logs sensitive credentials.
 *
 * @param {'UPLOAD'|'DOWNLOAD'|'DELETE'|'BATCH_DELETE'} operation
 * @param {'STARTED'|'SUCCESS'|'FAILED'|'RETRY'} status
 * @param {Object} meta - { s3Key, fileName, teamName, projectName, durationMs, size, attempt, error }
 */
function s3Log(operation, status, meta = {}) {
  let parsedTeamName = meta.teamName || '';
  let parsedProjectName = meta.projectName || '';
  let parsedFileName = meta.fileName || '';

  const s3Key = meta.s3Key || '';
  if (s3Key) {
    const parts = s3Key.split('/');
    if (parts.length >= 5) {
      if (!parsedTeamName) parsedTeamName = parts[2];
      if (!parsedProjectName) parsedProjectName = parts[3];
      if (!parsedFileName) parsedFileName = parts.slice(4).join('/');
    }
  }

  const entry = {
    timestamp: new Date().toISOString(),
    service: 'S3_SERVICE',
    operation,
    status,
    s3Key,
    fileName: parsedFileName,
    teamName: parsedTeamName,
    projectName: parsedProjectName,
    durationMs: meta.durationMs !== undefined ? meta.durationMs : null,
    sizeBytes: meta.size || null,
    attempt: meta.attempt || null,
    error: meta.error || null,
  };

  // Structured JSON Log for logging systems (Datadog, Splunk, etc.)
  console.log(JSON.stringify(entry));

  const tag = `[S3 ${operation}]`;
  const summary = `${entry.s3Key} | ${status}` +
    (entry.durationMs !== null ? ` | ${entry.durationMs}ms` : '') +
    (entry.sizeBytes ? ` | ${(entry.sizeBytes / 1024).toFixed(1)}KB` : '') +
    (entry.attempt ? ` | attempt ${entry.attempt}` : '') +
    (entry.error ? ` | ${entry.error}` : '');

  if (status === 'FAILED') {
    console.error(`${tag} ${summary}`);
  } else if (status === 'RETRY') {
    console.warn(`${tag} ${summary}`);
  } else {
    console.log(`${tag} ${summary}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 5: MIME TYPES
// ═══════════════════════════════════════════════════════════════════════════

const MIME_TYPES = {
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.pdf':  'application/pdf',
  '.doc':  'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.ppt':  'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xls':  'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 6: FILE VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate a file before upload.
 * All limits and allowed types are read from environment variables at call time
 * so that configuration changes take effect without code modification.
 *
 * @param {Object} file - Multer file object with { originalname, buffer, size }
 * @param {'image'|'document'} fileType - The type of file
 * @returns {{ valid: boolean, error?: string, errorCode?: string }}
 */
function validateFile(file, fileType) {
  if (!file || !file.originalname) {
    return { valid: false, error: 'File is missing or has no filename', errorCode: 'FILE_MISSING' };
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const fileSize = file.buffer ? file.buffer.length : (file.size || 0);

  if (fileType === 'image') {
    const allowed = getAllowedImageExtensions();
    const maxSize = getMaxImageSize();
    if (!allowed.includes(ext)) {
      return {
        valid: false,
        error: `Image type '${ext}' is not allowed. Allowed: ${allowed.join(', ')}`,
        errorCode: 'INVALID_IMAGE_TYPE',
      };
    }
    if (fileSize > maxSize) {
      return {
        valid: false,
        error: `Image '${file.originalname}' exceeds maximum size of ${maxSize / (1024 * 1024)} MB (actual: ${(fileSize / (1024 * 1024)).toFixed(2)} MB)`,
        errorCode: 'IMAGE_TOO_LARGE',
      };
    }
  } else if (fileType === 'document') {
    const allowed = getAllowedDocumentExtensions();
    const maxSize = getMaxDocumentSize();
    if (!allowed.includes(ext)) {
      return {
        valid: false,
        error: `Document type '${ext}' is not allowed. Allowed: ${allowed.join(', ')}`,
        errorCode: 'INVALID_DOCUMENT_TYPE',
      };
    }
    if (fileSize > maxSize) {
      return {
        valid: false,
        error: `Document '${file.originalname}' exceeds maximum size of ${maxSize / (1024 * 1024)} MB (actual: ${(fileSize / (1024 * 1024)).toFixed(2)} MB)`,
        errorCode: 'DOCUMENT_TOO_LARGE',
      };
    }
  }

  return { valid: true };
}

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 7: NAME HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sanitize a name for safe use in S3 keys (same logic as original safeName).
 */
function safeName(name) {
  if (!name) return 'untitled';
  // Prevent path traversal by removing double dots
  let sanitized = name.replace(/\.\./g, '');
  // Remove any invalid S3 characters (keep only letters, numbers, spaces, hyphens, underscores)
  sanitized = sanitized.replace(/[^a-zA-Z0-9 \-_]/g, '_');
  // Collapse multiple underscores and trim
  sanitized = sanitized.replace(/_+/g, '_').trim();
  return sanitized || 'untitled';
}

/**
 * Generate a unique filename with ddmmyy prefix to prevent overwrites.
 * Example: 100726_8293_logo.png
 */
function uniqueFilename(originalName) {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const rand = Math.floor(1000 + Math.random() * 9000);
  const dateStr = `${dd}${mm}${yy}_${rand}`;

  if (!originalName) return `${dateStr}_file`;
  const ext = path.extname(originalName).toLowerCase();
  // Prevent path traversal by removing double dots and remove invalid characters
  const base = path.basename(originalName, ext)
    .replace(/\.\./g, '')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .replace(/_+/g, '_')
    .trim();
  return `${dateStr}_${base || 'file'}${ext}`;
}

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 8: S3 KEY CONSTRUCTION (fully configurable, nothing hardcoded)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build the relative path portion stored in the database.
 * Format: <safeTeam>/<safeTitle>/<uniqueFilename>
 *
 * This is NOT the full S3 key. The full key is built by buildFullS3Key().
 * Storing only the relative path means the prefix can change (e.g. CDD → Analytics)
 * without needing to update any database records.
 *
 * @param {string} teamName - Raw team name from form
 * @param {string} projectTitle - Raw project title from form
 * @param {string} filename - Already-unique filename
 * @returns {string} Relative path, e.g. "FINANCE/Sales_Dashboard/1749200000000_logo.png"
 */
function buildRelativePath(teamName, projectTitle, filename) {
  const safeTeam = safeName(teamName);
  const safeTitle = safeName(projectTitle);
  return `${safeTeam}/${safeTitle}/${filename}`;
}

/**
 * Build the full S3 object key from a file type and a relative path.
 * Format: ${AWS_FOLDER_PREFIX}/<fileType>/<relativePath>
 *
 * The prefix is read from process.env.AWS_FOLDER_PREFIX at call time.
 * Examples:
 *   CDD/images/FINANCE/Sales_Dashboard/1749200000000_logo.png
 *   Analytics/documents/HR/Attrition/1749200000000_spec.pdf
 *
 * @param {'images'|'documents'} fileType - 'images' or 'documents'
 * @param {string} relativePath - Path from buildRelativePath()
 * @returns {string} Full S3 key
 */
function buildFullS3Key(fileType, relativePath) {
  return `${getFolderPrefix()}/${fileType}/${relativePath}`;
}

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 9: S3 OPERATIONS (with retry, structured logging, safe errors)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Determine if an AWS error is retryable.
 */
function isRetryableError(err) {
  // Retryable HTTP status codes
  const retryableStatuses = [500, 502, 503, 504, 429];
  const httpStatus = err.$metadata?.httpStatusCode;
  if (httpStatus && retryableStatuses.includes(httpStatus)) return true;

  // Retryable error names
  const retryableNames = [
    'InternalError', 'ServiceUnavailable', 'SlowDown', 'RequestTimeout',
    'RequestTimeTooSkewed', 'ThrottlingException', 'TooManyRequestsException',
    'ECONNRESET', 'ETIMEDOUT', 'EPIPE', 'NetworkingError',
  ];
  if (retryableNames.includes(err.name) || retryableNames.includes(err.code)) return true;

  return false;
}

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Upload a buffer to Amazon S3 with automatic retry and exponential backoff.
 *
 * @param {Buffer} buffer - File content
 * @param {string} s3Key - Full S3 object key
 * @param {string} contentType - MIME type
 * @returns {Promise<void>}
 */
async function uploadToS3(buffer, s3Key, contentType, metadata = {}) {
  const sdk = getAwsSdk();
  const client = getS3Client();
  const maxRetries = getRetryCount();
  const startTime = Date.now();

  s3Log('UPLOAD', 'STARTED', { s3Key, size: buffer.length });

  // Sanitize and format metadata keys and values for S3 (US-ASCII strings only)
  const s3Metadata = {};
  for (const [k, v] of Object.entries(metadata)) {
    if (v !== undefined && v !== null) {
      const sanitizedKey = k.toLowerCase().replace(/[^a-z0-9\-]/g, '-');
      const sanitizedValue = String(v).replace(/[^\x20-\x7E]/g, '?');
      s3Metadata[sanitizedKey] = sanitizedValue;
    }
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await client.send(new sdk.PutObjectCommand({
        Bucket: getBucketName(),
        Key: s3Key,
        Body: buffer,
        ContentType: contentType,
        Metadata: s3Metadata,
      }));

      const duration = Date.now() - startTime;
      s3Log('UPLOAD', 'SUCCESS', { s3Key, size: buffer.length, durationMs: duration });
      return;
    } catch (err) {
      const duration = Date.now() - startTime;
      const errorCode = err.name || err.code;

      if (attempt < maxRetries && isRetryableError(err)) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 8000); // 1s, 2s, 4s, max 8s
        s3Log('UPLOAD', 'RETRY', {
          s3Key,
          attempt: `${attempt}/${maxRetries}`,
          error: err.message,
          errorCode,
          durationMs: duration,
        });
        await sleep(backoffMs);
        continue;
      }

      // Final failure — all retries exhausted or non-retryable error
      s3Log('UPLOAD', 'FAILED', {
        s3Key,
        attempt: `${attempt}/${maxRetries}`,
        error: err.message,
        errorCode,
        durationMs: duration,
      });
      throw err;
    }
  }
}

/**
 * Get a readable stream from S3 for a given key.
 *
 * @param {string} s3Key - Full S3 object key
 * @returns {Promise<{ stream: ReadableStream, contentType: string, contentLength: number } | null>}
 */
async function getFromS3(s3Key) {
  const sdk = getAwsSdk();
  const client = getS3Client();
  const startTime = Date.now();

  s3Log('DOWNLOAD', 'STARTED', { s3Key });

  try {
    const response = await client.send(new sdk.GetObjectCommand({
      Bucket: getBucketName(),
      Key: s3Key,
    }));

    const duration = Date.now() - startTime;
    s3Log('DOWNLOAD', 'SUCCESS', { s3Key, size: response.ContentLength || 0, durationMs: duration });

    return {
      stream: response.Body,
      contentType: response.ContentType || 'application/octet-stream',
      contentLength: response.ContentLength || 0,
      etag: response.ETag || null,
      lastModified: response.LastModified || null,
    };
  } catch (err) {
    const duration = Date.now() - startTime;

    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      s3Log('DOWNLOAD', 'FAILED', { s3Key, error: 'Object not found', durationMs: duration });
      return null;
    }

    s3Log('DOWNLOAD', 'FAILED', { s3Key, error: err.message, durationMs: duration });
    throw new Error(`S3 download failed for ${s3Key}: ${err.message}`);
  }
}

/**
 * Delete a single object from S3.
 *
 * @param {string} s3Key - Full S3 object key
 * @returns {Promise<void>}
 */
async function deleteFromS3(s3Key) {
  const sdk = getAwsSdk();
  const client = getS3Client();
  const startTime = Date.now();

  s3Log('DELETE', 'STARTED', { s3Key });

  try {
    await client.send(new sdk.DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: s3Key,
    }));

    const duration = Date.now() - startTime;
    s3Log('DELETE', 'SUCCESS', { s3Key, durationMs: duration });
  } catch (err) {
    const duration = Date.now() - startTime;
    s3Log('DELETE', 'FAILED', { s3Key, error: err.message, durationMs: duration });
    throw new Error(`S3 delete failed for ${s3Key}: ${err.message}`);
  }
}

/**
 * Delete multiple objects from S3 in a single batch request.
 * S3 allows up to 1000 keys per batch delete.
 *
 * @param {string[]} s3Keys - Array of full S3 object keys
 * @returns {Promise<void>}
 */
async function deleteMultipleFromS3(s3Keys) {
  if (!s3Keys || s3Keys.length === 0) return;

  const sdk = getAwsSdk();
  const client = getS3Client();
  const startTime = Date.now();

  s3Log('BATCH_DELETE', 'STARTED', { s3Key: `${s3Keys.length} objects` });

  const BATCH_SIZE = 1000;
  for (let i = 0; i < s3Keys.length; i += BATCH_SIZE) {
    const batch = s3Keys.slice(i, i + BATCH_SIZE);
    try {
      await client.send(new sdk.DeleteObjectsCommand({
        Bucket: getBucketName(),
        Delete: {
          Objects: batch.map(key => ({ Key: key })),
          Quiet: true,
        },
      }));
    } catch (err) {
      const duration = Date.now() - startTime;
      s3Log('BATCH_DELETE', 'FAILED', {
        s3Key: `batch ${Math.floor(i / BATCH_SIZE) + 1}`,
        error: err.message,
        durationMs: duration,
      });
      throw new Error(`S3 batch delete failed: ${err.message}`);
    }
  }

  const duration = Date.now() - startTime;
  s3Log('BATCH_DELETE', 'SUCCESS', { s3Key: `${s3Keys.length} objects`, durationMs: duration });
}

/**
 * Check if an object exists in S3.
 *
 * @param {string} s3Key - Full S3 object key
 * @returns {Promise<boolean>}
 */
async function existsInS3(s3Key) {
  const sdk = getAwsSdk();
  const client = getS3Client();
  try {
    await client.send(new sdk.HeadObjectCommand({
      Bucket: getBucketName(),
      Key: s3Key,
    }));
    return true;
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw err;
  }
}

/**
 * Generate a Presigned URL for direct secure downloading/access in the future.
 * Uses lazy loading of @aws-sdk/s3-request-presigner.
 * If the library is not installed, falls back to returning the backend proxy path.
 *
 * @param {'images'|'documents'} fileType - 'images' or 'documents'
 * @param {string} relativePath - Relative path stored in DB
 * @param {number} expiresInSeconds - Time in seconds before the URL expires (default 1 hour)
 * @returns {Promise<string>} Presigned S3 URL or fallback proxy URL
 */
async function generatePresignedUrl(fileType, relativePath, expiresInSeconds = 3600) {
  const s3Key = buildFullS3Key(fileType, relativePath);
  const sdk = getAwsSdk();
  const client = getS3Client();
  try {
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    const command = new sdk.GetObjectCommand({
      Bucket: getBucketName(),
      Key: s3Key,
    });
    return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND' || err.message?.includes('Cannot find module')) {
      console.warn('[S3 SERVICE] @aws-sdk/s3-request-presigner is not installed. Returning fallback proxy URL.');
      return `/uploads/${fileType}/${relativePath}`;
    }
    throw err;
  }
}

/**
 * Centralized AWS S3 error classification and mapping.
 * Avoids exposing raw SDK exceptions and internal stack traces to the frontend.
 *
 * @param {Error} err - Raw AWS SDK error
 * @param {string} customMessage - Custom prefix message
 * @returns {{ statusCode: number, errorCode: string, message: string, originalError: string }}
 */
function handleS3Error(err, customMessage = 'Unable to complete S3 operation.') {
  const name = err.name || '';
  const status = err.$metadata?.httpStatusCode || 500;
  
  let errorCode = 'S3_OPERATION_FAILED';
  let message = customMessage;

  if (name === 'AccessDenied' || status === 403) {
    errorCode = 'AWS_ACCESS_DENIED';
    message = 'Access Denied: S3 permissions are missing or invalid.';
  } else if (name === 'NoSuchBucket' || (status === 404 && err.message?.toLowerCase().includes('bucket'))) {
    errorCode = 'AWS_BUCKET_NOT_FOUND';
    message = 'S3 Bucket was not found or is inaccessible.';
  } else if (name === 'NoSuchKey' || status === 404) {
    errorCode = 'AWS_FILE_NOT_FOUND';
    message = 'The requested file does not exist on S3.';
  } else if (name === 'TimeoutError' || err.code === 'ETIMEDOUT') {
    errorCode = 'AWS_NETWORK_TIMEOUT';
    message = 'Network timeout occurred while communicating with S3.';
  } else if (name === 'RegionMismatch' || err.message?.includes('RegionMismatch')) {
    errorCode = 'AWS_REGION_MISMATCH';
    message = 'AWS region mismatch: bucket region does not match configured region.';
  } else if (name === 'CredentialsError' || status === 401) {
    errorCode = 'AWS_INVALID_CREDENTIALS';
    message = 'Invalid AWS credentials provided.';
  }

  return {
    statusCode: status,
    errorCode,
    message,
    originalError: err.message || String(err),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  SECTION 10: MODULE EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // Startup
  validateConfig,
  verifyCredentials,

  // Health and Availability
  getS3Available,
  setS3Available,

  // Client / config
  getS3Client,
  getBucketName,
  getFolderPrefix,

  // Validation
  validateFile,
  getContentType,
  getAllowedImageExtensions,
  getAllowedDocumentExtensions,
  getMaxImageSize,
  getMaxDocumentSize,

  // Name helpers
  safeName,
  uniqueFilename,
  buildRelativePath,
  buildFullS3Key,

  // S3 operations
  uploadToS3,
  getFromS3,
  deleteFromS3,
  deleteMultipleFromS3,
  existsInS3,
  generatePresignedUrl,
  handleS3Error,
};

Object.defineProperty(module.exports, 'S3_AVAILABLE', {
  get: () => getS3Available(),
  set: (val) => setS3Available(val),
  configurable: true,
  enumerable: true
});
