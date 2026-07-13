# =============================================================================
# Dockerfile — Main Website Backend
# =============================================================================
# Service:     ADM Main Website Backend (Node.js / Express)
# Base Image:  node:20-alpine3.21
#              - Node.js 20 LTS: long-term support, stable API
#              - Alpine 3.21: minimal Linux (~5 MB), reduces attack surface
#              - No engines.node in package.json, defaulting to Node 20 LTS
# Port:        3000 (configurable via MAIN_BACKEND_PORT env var)
# Health:      GET /api/health (verified in index.js line 172)
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
#   Each layer is cached independently. When only source changes,
#   Docker skips steps 1–3 entirely.
#
# STARTUP COMMAND:
#   CMD ["node", "index.js"]
#   Verified from package.json: "start": "node index.js"
#   Using node directly instead of npm start avoids an intermediate npm
#   process that does not forward SIGTERM, enabling graceful shutdown.
#
# DIRECTORY STRUCTURE INSIDE CONTAINER:
#   /app/
#   ├── shared/s3Service.js              ← shared modules
#   └── 1_main_website/backend/          ← WORKDIR
#       ├── index.js
#       ├── db.js
#       ├── routes/
#       └── node_modules/
#
# ENVIRONMENT VARIABLES (passed at runtime, never baked in):
#   Required: DB_URL, TOKEN_ENCRYPTION_KEY
#   Optional: MAIN_BACKEND_PORT (default 3000), HOST (default 0.0.0.0)
#
# SECURITY:
#   - Runs as non-root 'node' user (UID 1000)
#   - No secrets in image layers
#   - Production-only dependencies
#   - Minimal Alpine base
#
# BUILD (from project root):
#   docker build -f 1_main_website/backend/Dockerfile -t adm-main-backend .
#
# RUN:
#   docker run -d --name adm-main-backend \
#     --env-file .env.docker \
#     -p 3000:3000 \
#     --restart unless-stopped \
#     adm-main-backend
# =============================================================================

FROM node:20-alpine3.21

# ── OCI Image Labels ───────────────────────────────────────────────────────
# Build-time arguments mapped to OCI labels
ARG APP_VERSION=1.0.0
ARG SOURCE_COMMIT=unknown
ARG SOURCE_REPO=https://github.com/Parakuruvinayreddy/is-adm-AACE-india-analytics-self-services-porta
ARG LICENSE=UNLICENSED

LABEL org.opencontainers.image.title="ADM Main Website Backend" \
      org.opencontainers.image.description="Main Website Backend — Node.js Express API server" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${SOURCE_COMMIT}" \
      org.opencontainers.image.source="${SOURCE_REPO}" \
      org.opencontainers.image.licenses="${LICENSE}" \
      org.opencontainers.image.vendor="ADM Analytics Team"

# ── Runtime Environment ────────────────────────────────────────────────────
ENV NODE_ENV=production

# ── System Packages ────────────────────────────────────────────────────────
# curl is required for the HEALTHCHECK instruction.
# --no-cache avoids persisting the apk index, keeping the layer small.
RUN apk add --no-cache curl

# ── Working Directory ──────────────────────────────────────────────────────
# Mirrors the monorepo layout so relative require() paths resolve correctly.
# e.g., require('../../shared/s3Service') → /app/shared/s3Service.js
WORKDIR /app/1_main_website/backend

# ── Dependency Installation (layer-cached) ──────────────────────────────────
# Copy package manifests first. package*.json glob copies both package.json
# and package-lock.json (if present) without failing if the lock is absent.
COPY 1_main_website/backend/package*.json ./

# Prefer npm ci (deterministic, uses lockfile) with fallback to npm install.
# Only production dependencies are installed (--omit=dev).
RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev; \
    else \
      echo "WARN: package-lock.json not found, falling back to npm install"; \
      npm install --omit=dev; \
    fi && npm cache clean --force

# ── Shared Modules ──────────────────────────────────────────────────────────
# The main backend does not directly import shared/, but it is included
# for consistency with admin and intake backends that do.
COPY shared/ /app/shared/

# ── Application Source ──────────────────────────────────────────────────────
# Copied last because this layer changes most frequently.
COPY 1_main_website/backend/ ./

# ── Non-Root User ───────────────────────────────────────────────────────────
# The node:alpine image provides a built-in 'node' user (UID 1000).
# Running as non-root limits damage if the process is compromised.
USER node

# ── Port ────────────────────────────────────────────────────────────────────
# Matches: const PORT = process.env.MAIN_BACKEND_PORT || 3000  (index.js:272)
EXPOSE 3000

# ── Graceful Shutdown ──────────────────────────────────────────────────────
# SIGTERM tells Node.js to exit cleanly. Using node directly (not npm)
# ensures PID 1 receives the signal without an intermediary process.
STOPSIGNAL SIGTERM

# ── Health Check ────────────────────────────────────────────────────────────
# Verified: GET /api/health exists at index.js line 172.
# Docker probes every 30s. After 3 failures (10s timeout each) the
# container is marked unhealthy. 30s start-period allows for DB connections.
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD ["sh", "-c", "curl -sf http://localhost:${MAIN_BACKEND_PORT:-3000}/api/health || exit 1"]

# ── Start Application ──────────────────────────────────────────────────────
# Verified from package.json: "start": "node index.js"
CMD ["node", "index.js"]
