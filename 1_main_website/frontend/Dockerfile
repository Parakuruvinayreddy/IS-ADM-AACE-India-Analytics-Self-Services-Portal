# =============================================================================
# Dockerfile — Main Website Frontend
# =============================================================================
# Service:     ADM Main Website Frontend (React / Vite → Nginx)
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
#   The main website frontend has a NESTED structure:
#     1_main_website/frontend/
#       ├── server.js              ← dev Express server (IGNORED in production)
#       └── adm-dashboard/         ← the actual Vite React app
#           ├── src/
#           ├── package.json       ← "build": "vite build"
#           └── vite.config.js     ← base: '/' (default root path)
#
#   In production, Nginx replaces server.js. Only adm-dashboard/ is built.
#
# PRODUCTION OPTIMIZATIONS:
#   - Multi-stage build eliminates Node.js from runtime (~290 MB saved)
#   - npm cache cleaned in build stage to reduce intermediate layer size
#   - Only compiled dist/ output copied to runtime image
#
# BUILD (from project root):
#   docker build -f 1_main_website/frontend/Dockerfile -t adm-main-frontend .
#
# RUN:
#   docker run -d --name adm-main-frontend \
#     -p 8081:80 \
#     --restart unless-stopped \
#     adm-main-frontend
# =============================================================================

# ─────────────────────────────────────────────────────────────────────────────
# STAGE 1: Build
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine3.21 AS build

WORKDIR /app

# Copy package manifests first for layer caching.
COPY 1_main_website/frontend/adm-dashboard/package*.json ./

# Prefer npm ci with fallback. All dependencies needed for Vite build.
RUN if [ -f package-lock.json ]; then \
      npm ci; \
    else \
      echo "WARN: package-lock.json not found, falling back to npm install"; \
      npm install; \
    fi && npm cache clean --force

# Copy the dashboard source code
COPY 1_main_website/frontend/adm-dashboard/ ./

# Build the production bundle. Vite outputs to /app/dist/.
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

LABEL org.opencontainers.image.title="ADM Main Website Frontend" \
      org.opencontainers.image.description="Main Website Frontend — React SPA served by Nginx" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${SOURCE_COMMIT}" \
      org.opencontainers.image.source="${SOURCE_REPO}" \
      org.opencontainers.image.licenses="${LICENSE}" \
      org.opencontainers.image.vendor="ADM Analytics Team"

# Replace default Nginx config with our SPA-aware configuration
RUN rm -f /etc/nginx/conf.d/default.conf
COPY 1_main_website/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy ONLY compiled assets from build stage — no Node.js, no source code
COPY --from=build /app/dist /usr/share/nginx/html

# ── Port ────────────────────────────────────────────────────────────────────
EXPOSE 80

# ── Health Check ────────────────────────────────────────────────────────────
# Uses wget (built into Alpine) to avoid installing curl.
# Checks that Nginx is serving the SPA root.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD ["sh", "-c", "wget -qO /dev/null http://localhost:80/ || exit 1"]

# ── Start Nginx ─────────────────────────────────────────────────────────────
# Runs in foreground so Docker can track the process and receive logs.
CMD ["nginx", "-g", "daemon off;"]
