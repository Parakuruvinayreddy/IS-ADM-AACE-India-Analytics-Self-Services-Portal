# =============================================================================
# Dockerfile — Intake Page Frontend
# =============================================================================
# Service:     ADM Intake Page Frontend (React / Vite → Nginx)
# Build Image: node:20-alpine3.21  → compiles React/Vite to static assets
# Runtime:     nginx:1.27-alpine3.21 → serves static assets (~10 MB)
# Port:        80 (standard Nginx port inside container)
#
# BUILD STAGES:
#   Stage 1 (build):  Node.js + all dependencies → vite build → /app/dist/
#   Stage 2 (runtime): Nginx Alpine + compiled HTML/JS/CSS only
#   Result: ~15 MB runtime image. No Node.js, no source code, no node_modules.
#
# LAYER CACHING STRATEGY:
#   Build stage:
#     1. package*.json → npm install (cached unless deps change)
#     2. Source code → vite build (rebuilt on every source change)
#   Runtime stage:
#     1. Custom nginx.conf (cached unless config changes)
#     2. Compiled assets from build stage
#
# MODULE-SPECIFIC NOTES:
#   The intake frontend is served from the /intake/ base path.
#   vite.config.js sets: base: '/intake/'
#
#   This means:
#     - All generated asset URLs are prefixed with /intake/
#     - Nginx serves files under the /intake/ location block
#     - SPA fallback returns /intake/index.html
#     - Build output is placed in /usr/share/nginx/html/intake/
#
# BUILD (from project root):
#   docker build -f 3_intake_page/frontend/Dockerfile -t adm-intake-frontend .
#
# RUN:
#   docker run -d --name adm-intake-frontend \
#     -p 5175:80 \
#     --restart unless-stopped \
#     adm-intake-frontend
# =============================================================================

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 1: Build
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine3.21 AS build

WORKDIR /app

# Copy package manifests first for layer caching.
COPY 3_intake_page/frontend/package*.json ./

# Prefer npm ci with fallback. All dependencies needed for Vite build.
RUN if [ -f package-lock.json ]; then \
      npm ci; \
    else \
      echo "WARN: package-lock.json not found, falling back to npm install"; \
      npm install; \
    fi && npm cache clean --force

# Copy the full frontend source code
COPY 3_intake_page/frontend/ ./

# Build the production bundle. Vite outputs to /app/dist/ with base: '/intake/'.
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 2: Runtime
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine3.21

# ── OCI Image Labels ───────────────────────────────────────────────────────
# Build-time arguments mapped to OCI labels
ARG APP_VERSION=1.0.0
ARG SOURCE_COMMIT=unknown
ARG SOURCE_REPO=https://github.com/Parakuruvinayreddy/is-adm-AACE-india-analytics-self-services-porta
ARG LICENSE=UNLICENSED

LABEL org.opencontainers.image.title="ADM Intake Page Frontend" \
      org.opencontainers.image.description="Intake Page Frontend — React SPA served by Nginx under /intake/" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${SOURCE_COMMIT}" \
      org.opencontainers.image.source="${SOURCE_REPO}" \
      org.opencontainers.image.licenses="${LICENSE}" \
      org.opencontainers.image.vendor="ADM Analytics Team"

# Replace default Nginx config with our SPA-aware configuration
RUN rm -f /etc/nginx/conf.d/default.conf
COPY 3_intake_page/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled assets into /intake/ subdirectory (matches Vite base: '/intake/')
COPY --from=build /app/dist /usr/share/nginx/html/intake

# ── Port ────────────────────────────────────────────────────────────────────
EXPOSE 80

# ── Health Check ────────────────────────────────────────────────────────────
# Uses wget (built into Alpine). Checks the /intake/ path since root redirects.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD ["sh", "-c", "wget -qO /dev/null http://localhost:80/intake/ || exit 1"]

# ── Start Nginx ─────────────────────────────────────────────────────────────
CMD ["nginx", "-g", "daemon off;"]
