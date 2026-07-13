# =============================================================================
# Dockerfile — Admin Website Backend
# =============================================================================
# Service:     ADM Admin Website Backend (Node.js / Express)
# Base Image:  node:20-alpine3.21
#              - Node.js 20 LTS: long-term support, stable API
#              - Alpine 3.21: minimal Linux (~5 MB), reduces attack surface
#              - No engines.node in package.json, defaulting to Node 20 LTS
# Port:        3001 (configurable via ADMIN_BACKEND_PORT env var)
# Health:      GET /api/health (verified in index.js line 151)
#
# BUILD STAGES:
#   Single-stage — Node.js backends don't compile to a separate artifact.
#   The runtime IS Node.js, so a second stage would still need the same
#   base image. Using --omit=dev already excludes devDependencies.
#
# LAYER CACHING STRATEGY:
#   1. System packages (rarely changes)
#   2. package*.json → npm install (changes when deps change)
#   3. shared/ directory (changes occasionally)
#   4. Application source (changes most frequently)
#
# STARTUP COMMAND:
#   CMD ["node", "index.js"]
#   Verified from package.json: "start": "node index.js"
#   Using node directly avoids an intermediate npm process that does not
#   forward SIGTERM, enabling graceful shutdown.
#
# SHARED MODULE DEPENDENCY:
#   This backend imports from the shared directory at two depths:
#     - index.js line 35:        require('../../shared/s3Service')
#     - routes/teams.js line 119: require('../../../shared/s3Service')
#   The container directory structure mirrors the monorepo layout so
#   these paths resolve without any code changes.
#
# DIRECTORY STRUCTURE INSIDE CONTAINER:
#   /app/
#   ├── shared/s3Service.js              ← shared modules
#   └── 2_admin_website/backend/         ← WORKDIR
#       ├── index.js
#       ├── db.js
#       ├── routes/
#       └── node_modules/
#
# ENVIRONMENT VARIABLES (passed at runtime, never baked in):
#   Required: DB_URL, AWS_REGION, AWS_BUCKET_NAME,
#             AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
#   Optional: ADMIN_BACKEND_PORT (default 3001), HOST (default 0.0.0.0),
#             AWS_FOLDER_PREFIX (default CDD), AWS_SESSION_TOKEN
#
# SECURITY:
#   - Runs as non-root 'node' user (UID 1000)
#   - No secrets in image layers
#   - Production-only dependencies
#   - Minimal Alpine base
#
# BUILD (from project root):
#   docker build -f 2_admin_website/backend/Dockerfile -t adm-admin-backend .
#
# RUN:
#   docker run -d --name adm-admin-backend \
#     --env-file .env.docker \
#     -p 3001:3001 \
#     --restart unless-stopped \
#     adm-admin-backend
# =============================================================================

FROM node:20-alpine3.21

# ── OCI Image Labels ───────────────────────────────────────────────────────
# Build-time arguments mapped to OCI labels
ARG APP_VERSION=1.0.0
ARG SOURCE_COMMIT=unknown
ARG SOURCE_REPO=https://github.com/Parakuruvinayreddy/is-adm-AACE-india-analytics-self-services-porta
ARG LICENSE=UNLICENSED

LABEL org.opencontainers.image.title="ADM Admin Website Backend" \
      org.opencontainers.image.description="Admin Website Backend — Node.js Express API with S3 integration" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${SOURCE_COMMIT}" \
      org.opencontainers.image.source="${SOURCE_REPO}" \
      org.opencontainers.image.licenses="${LICENSE}" \
      org.opencontainers.image.vendor="ADM Analytics Team"

# ── Runtime Environment ────────────────────────────────────────────────────
ENV NODE_ENV=production

# ── System Packages ────────────────────────────────────────────────────────
# curl is required for the HEALTHCHECK instruction.
RUN apk add --no-cache curl

# ── Working Directory ──────────────────────────────────────────────────────
# Mirrors the monorepo layout so relative require() paths resolve correctly.
WORKDIR /app/2_admin_website/backend

# ── Dependency Installation (layer-cached) ──────────────────────────────────
COPY 2_admin_website/backend/package*.json ./

# Prefer npm ci (deterministic, uses lockfile) with fallback to npm install.
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev; \
    else \
      echo "WARN: package-lock.json not found, falling back to npm install"; \
      npm install --omit=dev; \
    fi && npm cache clean --force

# ── Shared Modules ──────────────────────────────────────────────────────────
# Required: index.js and routes/teams.js import ../../shared/s3Service
COPY shared/ /app/shared/

# ── Application Source ──────────────────────────────────────────────────────
COPY 2_admin_website/backend/ ./

# ── Non-Root User ───────────────────────────────────────────────────────────
USER node

# ── Port ────────────────────────────────────────────────────────────────────
# Matches: const PORT = process.env.ADMIN_BACKEND_PORT || 3001  (index.js:212)
EXPOSE 3001

# ── Graceful Shutdown ──────────────────────────────────────────────────────
STOPSIGNAL SIGTERM

# ── Health Check ────────────────────────────────────────────────────────────
# Verified: GET /api/health exists at index.js line 151.
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD ["sh", "-c", "curl -sf http://localhost:${ADMIN_BACKEND_PORT:-3001}/api/health || exit 1"]

# ── Start Application ──────────────────────────────────────────────────────
# Verified from package.json: "start": "node index.js"
CMD ["node", "index.js"]
