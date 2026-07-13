#!/bin/bash
# ================================================================
#  ADM Analytics Platform - EC2 Ubuntu Quick-Start Script
#  Usage:  chmod +x start_all.sh && ./start_all.sh
#
#  Prerequisites (Ubuntu EC2):
#    1. dzdo apt update && dzdo apt install -y nodejs npm lsof postgresql
#    2. Set up PostgreSQL:
#       dzdo -u postgres psql -c "ALTER USER postgres PASSWORD 'YOUR_PASSWORD';"
#       dzdo -u postgres psql -c "CREATE DATABASE users_db;"
#       dzdo -u postgres psql -c "CREATE DATABASE adm_admin_db;"
#    3. Create .env file in project root:
#       echo "PGPASSWORD=YOUR_PASSWORD" > .env
#
#  Launches all 6 services in the background.
#  Logs are saved to ./logs/
#  PIDs are saved to ./logs/pids.txt for easy cleanup.
# ================================================================

echo ""
echo "================================================="
echo "   ADM Analytics Platform - Starting All Modules"
echo "================================================="
echo ""

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$ROOT_DIR/logs/pids.txt"

# -- Create logs directory --
mkdir -p "$ROOT_DIR/logs"
> "$PID_FILE"

# ============================================================
#  STEP 1: Load PostgreSQL credentials
#  Priority: 1) Already in environment  2) .env file  3) Error
# ============================================================
ENV_FILE_ROOT="$ROOT_DIR/.env"

if [ -n "$PGPASSWORD" ]; then
  echo "[CRED] PGPASSWORD already set in environment — using it."

elif [ -f "$ENV_FILE_ROOT" ]; then
  echo "[CRED] Loading credentials from $ENV_FILE_ROOT ..."
  # Source only well-formed KEY=VALUE lines (ignore comments & blanks)
  set -a
  while IFS='=' read -r key value; do
    # Skip blank lines and comments
    [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
    # Trim leading/trailing whitespace from key
    key=$(echo "$key" | xargs)
    # Remove surrounding quotes from value if present
    value=$(echo "$value" | sed -e "s/^['\"]//;s/['\"]$//")
    export "$key=$value"
  done < "$ENV_FILE_ROOT"
  set +a
  echo "  Loaded."

else
  echo ""
  echo "================================================================"
  echo "  [ERROR] .env file not found!"
  echo "================================================================"
  echo ""
  echo "  PGPASSWORD is not set and no .env file exists at:"
  echo "    $ENV_FILE_ROOT"
  echo ""
  echo "  ── Quick fix (run once on your EC2): ──"
  echo ""
  echo "    echo \"PGPASSWORD=your_postgres_password\" > $ENV_FILE_ROOT"
  echo ""
  echo "  Replace 'your_postgres_password' with your actual PostgreSQL"
  echo "  password, then re-run this script."
  echo ""
  echo "  Alternatively, export it manually before running:"
  echo "    export PGPASSWORD='your_postgres_password'"
  echo "================================================================"
  exit 1
fi

# -- If PGPASSWORD is empty but DB_URL is set, extract PGPASSWORD from DB_URL --
if [ -z "$PGPASSWORD" ] && [ -n "$DB_URL" ]; then
  echo "[CRED] Extracting PGPASSWORD from DB_URL..."
  USER_PASS=$(echo "$DB_URL" | sed -e 's|.*://\([^@]*\)@.*|\1|')
  RAW_PASS=$(echo "$USER_PASS" | cut -d: -f2-)
  PGPASSWORD=$(echo "$RAW_PASS" | sed -e 's|%40|@|g; s|%23|#|g; s|%3A|:|g; s|%2F|/|g; s|%3F|?|g')
  export PGPASSWORD
fi

# -- Validate PGPASSWORD is not empty after loading --
if [ -z "$PGPASSWORD" ]; then
  echo ""
  echo "================================================================"
  echo "  [ERROR] PGPASSWORD is empty!"
  echo "================================================================"
  echo ""
  echo "  The .env file was loaded but PGPASSWORD is blank or missing."
  echo "  Edit your .env file at: $ENV_FILE_ROOT"
  echo "  and make sure it contains:"
  echo ""
  echo "    PGPASSWORD=your_postgres_password"
  echo "================================================================"
  exit 1
fi

echo "[CRED] PGPASSWORD is set ✓"
echo ""

# ============================================================
#  STEP 2: Ensure PostgreSQL is running
# ============================================================
echo "[PG] Checking PostgreSQL service..."
if command -v systemctl >/dev/null 2>&1; then
  if ! systemctl is-active --quiet postgresql 2>/dev/null; then
    echo "[PG] PostgreSQL is not running — starting it..."
    dzdo -i bash -c "systemctl start postgresql"
    sleep 2
    if systemctl is-active --quiet postgresql 2>/dev/null; then
      echo "[PG] PostgreSQL started successfully ✓"
    else
      echo "[PG] WARNING: Could not start PostgreSQL."
      echo "  Run: dzdo -i  then: systemctl status postgresql"
    fi
  else
    echo "[PG] PostgreSQL is already running ✓"
  fi
elif command -v pg_isready >/dev/null 2>&1; then
  if ! pg_isready -q 2>/dev/null; then
    echo "[PG] PostgreSQL is not ready — attempting to start..."
    dzdo -i bash -c "service postgresql start" 2>/dev/null || true
    sleep 2
  else
    echo "[PG] PostgreSQL is ready ✓"
  fi
else
  echo "[PG] Cannot detect PostgreSQL service manager — assuming it is running."
fi
echo ""

# ============================================================
#  STEP 2.5: Auto-create databases if they do not exist
# ============================================================
echo "[DB] Checking if required databases exist..."

# Ensure is_adm_india schema exists in postgres database
echo "[DB] Ensuring schema is_adm_india exists in postgres database..."
PGPASSWORD="$PGPASSWORD" psql -U postgres -h localhost -d postgres -c "CREATE SCHEMA IF NOT EXISTS is_adm_india;" 2>&1

# Run users_db schema (only creates tables IF NOT EXISTS) on is_adm_india schema
echo "[DB] Applying users_db schema (IF NOT EXISTS) to is_adm_india schema..."
if [ -f "$ROOT_DIR/database/schema_users.sql" ]; then
  PGPASSWORD="$PGPASSWORD" PGOPTIONS="-c search_path=is_adm_india" psql -U postgres -h localhost -d postgres -f "$ROOT_DIR/database/schema_users.sql" 2>&1 | tail -3
else
  echo "  schema_users.sql not found — users table will be created by the auth module at startup."
fi

echo ""

# ============================================================
#  STEP 3: Build database connection URLs
# ============================================================
if [ -z "$DB_URL" ]; then
  # URL-encode the password (replace @ with %40, # with %23)
  PG_PWD_URL=$(echo "$PGPASSWORD" | sed 's/@/%40/g; s/#/%23/g')
  export PGPASSWORD
  export DB_URL="postgresql://postgres:${PG_PWD_URL}@localhost:5432/postgres?options=-c%20search_path%3Dis_adm_india"
fi

echo "[DB] DB_URL = $DB_URL"
echo ""

# ============================================================
#  STEP 4: Detect public IP for Intake email URLs
#  Priority: 1) INTAKE_BASE_URL from .env  2) EC2 metadata  3) localhost
# ============================================================
if [ -n "$INTAKE_BASE_URL" ]; then
  echo "[IP] INTAKE_BASE_URL from environment: $INTAKE_BASE_URL"
else
  echo "[IP] Detecting public IP..."
  PUBLIC_IP=$(curl -s --max-time 3 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || true)
  if [ -n "$PUBLIC_IP" ] && echo "$PUBLIC_IP" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'; then
    export INTAKE_BASE_URL="http://${PUBLIC_IP}:5174/intake"
    echo "[IP] EC2 public IP detected: $PUBLIC_IP"
    echo "[IP] INTAKE_BASE_URL = $INTAKE_BASE_URL"
  else
    PRIVATE_IP_DETECT=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
    export INTAKE_BASE_URL="http://${PRIVATE_IP_DETECT}:5174/intake"
    echo "[IP] Not on EC2 — using private IP: $PRIVATE_IP_DETECT"
    echo "[IP] INTAKE_BASE_URL = $INTAKE_BASE_URL"
  fi
fi
echo ""

# -- Auto-create / update .env for admin backend --
ENV_FILE="$ROOT_DIR/2_admin_website/backend/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "[ENV] Creating $ENV_FILE..."
  cat > "$ENV_FILE" << EOF
PORT=3001
UPLOAD_DIR=./uploads
HOST=0.0.0.0
DB_URL=$DB_URL
INTAKE_BASE_URL=$INTAKE_BASE_URL
TOKEN_ENCRYPTION_KEY=$TOKEN_ENCRYPTION_KEY
AWS_REGION=$AWS_REGION
AWS_BUCKET_NAME=$AWS_BUCKET_NAME
AWS_FOLDER_PREFIX=$AWS_FOLDER_PREFIX
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN
EOF
  echo "  Done."
else
  echo "[ENV] $ENV_FILE already exists — updating variables..."
  for VAR_NAME in DB_URL INTAKE_BASE_URL TOKEN_ENCRYPTION_KEY AWS_REGION AWS_BUCKET_NAME AWS_FOLDER_PREFIX AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN; do
    VAR_VAL=$(eval echo "\$$VAR_NAME")
    if [ -n "$VAR_VAL" ]; then
      if grep -q "^${VAR_NAME}=" "$ENV_FILE" 2>/dev/null; then
        sed -i "s|^${VAR_NAME}=.*|${VAR_NAME}=$VAR_VAL|" "$ENV_FILE"
      else
        echo "${VAR_NAME}=$VAR_VAL" >> "$ENV_FILE"
      fi
    fi
  done
  echo "  Done."
fi

# -- Auto-create / update .env for main backend --
ENV_M1="$ROOT_DIR/1_main_website/backend/.env"
if [ ! -f "$ENV_M1" ]; then
  echo "[ENV] Creating $ENV_M1..."
  cat > "$ENV_M1" << EOF
PORT=3000
HOST=0.0.0.0
DB_URL=$DB_URL
TOKEN_ENCRYPTION_KEY=$TOKEN_ENCRYPTION_KEY
EOF
  echo "  Done."
else
  echo "[ENV] $ENV_M1 already exists — updating variables..."
  for VAR_NAME in DB_URL TOKEN_ENCRYPTION_KEY; do
    VAR_VAL=$(eval echo "\$$VAR_NAME")
    if [ -n "$VAR_VAL" ]; then
      if grep -q "^${VAR_NAME}=" "$ENV_M1" 2>/dev/null; then
        sed -i "s|^${VAR_NAME}=.*|${VAR_NAME}=$VAR_VAL|" "$ENV_M1"
      else
        echo "${VAR_NAME}=$VAR_VAL" >> "$ENV_M1"
      fi
    fi
  done
  echo "  Done."
fi

# -- Auto-create / update .env for intake backend --
ENV_M3="$ROOT_DIR/3_intake_page/backend/.env"
if [ ! -f "$ENV_M3" ]; then
  echo "[ENV] Creating $ENV_M3..."
  cat > "$ENV_M3" << EOF
PORT=8000
HOST=0.0.0.0
DB_URL=$DB_URL
INTAKE_BASE_URL=$INTAKE_BASE_URL
TOKEN_ENCRYPTION_KEY=$TOKEN_ENCRYPTION_KEY
AWS_REGION=$AWS_REGION
AWS_BUCKET_NAME=$AWS_BUCKET_NAME
AWS_FOLDER_PREFIX=$AWS_FOLDER_PREFIX
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN
EOF
  echo "  Done."
else
  echo "[ENV] $ENV_M3 already exists — updating variables..."
  for VAR_NAME in DB_URL INTAKE_BASE_URL TOKEN_ENCRYPTION_KEY AWS_REGION AWS_BUCKET_NAME AWS_FOLDER_PREFIX AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN; do
    VAR_VAL=$(eval echo "\$$VAR_NAME")
    if [ -n "$VAR_VAL" ]; then
      if grep -q "^${VAR_NAME}=" "$ENV_M3" 2>/dev/null; then
        sed -i "s|^${VAR_NAME}=.*|${VAR_NAME}=$VAR_VAL|" "$ENV_M3"
      else
        echo "${VAR_NAME}=$VAR_VAL" >> "$ENV_M3"
      fi
    fi
  done
  echo "  Done."
fi

# -- Auto-create / update .env for Main frontend --
ENV_M1_FE="$ROOT_DIR/1_main_website/frontend/adm-dashboard/.env"
if [ ! -f "$ENV_M1_FE" ]; then
  echo "[ENV] Creating $ENV_M1_FE..."
  touch "$ENV_M1_FE"
  echo "  Done."
fi

# -- Auto-create / update .env for Admin frontend --
ENV_M2_FE="$ROOT_DIR/2_admin_website/frontend/.env"
if [ ! -f "$ENV_M2_FE" ]; then
  echo "[ENV] Creating $ENV_M2_FE..."
  touch "$ENV_M2_FE"
  echo "  Done."
fi
echo ""

# -- Check prerequisites --
echo "[CHECK] Verifying prerequisites..."
MISSING=""
command -v node  >/dev/null 2>&1 || MISSING="$MISSING node"
command -v npm   >/dev/null 2>&1 || MISSING="$MISSING npm"

if [ -n "$MISSING" ]; then
  echo "  ERROR: Missing required tools:$MISSING"
  echo "  Run: dzdo apt update && dzdo apt install -y nodejs npm"
  exit 1
fi

echo "  Node    : $(node --version)"
echo "  npm     : $(npm --version)"
echo ""

# -- Helper: kill process on a port --
kill_port() {
  PORT=$1
  PID=$(lsof -t -i:"$PORT" 2>/dev/null || true)
  if [ -n "$PID" ]; then
    echo "  Killing existing process on port $PORT (PID $PID)..."
    kill -9 $PID 2>/dev/null || true
    sleep 0.5
  fi
}

echo "[CLEANUP] Freeing ports..."
for port in 3001 3002 8000 5174 5175 3000 8081; do
  kill_port $port
done
echo ""

# -- Install Node dependencies --
echo "[DEPS] Installing Node dependencies..."

echo "  -> 1_main_website/backend"
cd "$ROOT_DIR/1_main_website/backend"
npm install --silent 2>&1 | tail -1

echo "  -> 2_admin_website/backend"
cd "$ROOT_DIR/2_admin_website/backend"
npm install --silent 2>&1 | tail -1

echo "  -> 2_admin_website/frontend"
cd "$ROOT_DIR/2_admin_website/frontend"
npm install --silent 2>&1 | tail -1

echo "  -> 3_intake_page/backend"
cd "$ROOT_DIR/3_intake_page/backend"
npm install --silent 2>&1 | tail -1

echo "  -> 3_intake_page/frontend"
cd "$ROOT_DIR/3_intake_page/frontend"
npm install --silent 2>&1 | tail -1

echo "  -> 1_main_website/frontend/adm-dashboard"
cd "$ROOT_DIR/1_main_website/frontend/adm-dashboard"
npm install --silent 2>&1 | tail -1

echo "  Done."
echo ""

# -- Build Main Website Frontend (serves from dist/) --
echo "[BUILD] Building Main Website Frontend..."
cd "$ROOT_DIR/1_main_website/frontend/adm-dashboard"
npm run build 2>&1 | tail -3
echo ""

# -- Create tables in adm_admin_db (IF NOT EXISTS) --
echo "[DB] Initialising tables..."
cd "$ROOT_DIR/2_admin_website/backend"
node setup_db.js
echo ""

# ==============================================================
#  LAUNCH ALL SERVICES
# ==============================================================

# -- MODULE 2 : Admin Website --
echo "[2] Starting Admin Website Backend  (Port 3001)..."
cd "$ROOT_DIR/2_admin_website/backend"
DB_URL="$DB_URL" INTAKE_BASE_URL="$INTAKE_BASE_URL" TOKEN_ENCRYPTION_KEY="$TOKEN_ENCRYPTION_KEY" AWS_REGION="$AWS_REGION" AWS_BUCKET_NAME="$AWS_BUCKET_NAME" AWS_FOLDER_PREFIX="$AWS_FOLDER_PREFIX" AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" AWS_SESSION_TOKEN="$AWS_SESSION_TOKEN" nohup node index.js > "$ROOT_DIR/logs/admin_backend.log" 2>&1 &
echo "$!" >> "$PID_FILE"
echo "    PID $!"

echo "[2] Starting Admin Website Frontend (Port 3002)..."
cd "$ROOT_DIR/2_admin_website/frontend"
nohup npx vite --host 0.0.0.0 --port 3002 > "$ROOT_DIR/logs/admin_frontend.log" 2>&1 &
echo "$!" >> "$PID_FILE"
echo "    PID $!"

sleep 2

# -- MODULE 3 : Intake Page --
echo "[3] Starting Intake Page Backend    (Port 8000)..."
cd "$ROOT_DIR/3_intake_page/backend"
DB_URL="$DB_URL" INTAKE_BASE_URL="$INTAKE_BASE_URL" TOKEN_ENCRYPTION_KEY="$TOKEN_ENCRYPTION_KEY" AWS_REGION="$AWS_REGION" AWS_BUCKET_NAME="$AWS_BUCKET_NAME" AWS_FOLDER_PREFIX="$AWS_FOLDER_PREFIX" AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" AWS_SESSION_TOKEN="$AWS_SESSION_TOKEN" nohup node index.js > "$ROOT_DIR/logs/intake_backend.log" 2>&1 &
echo "$!" >> "$PID_FILE"
echo "    PID $!"

echo "[3] Starting Intake Page Frontend   (Port 5175)..."
cd "$ROOT_DIR/3_intake_page/frontend"
nohup npx vite --host 0.0.0.0 --port 5175 > "$ROOT_DIR/logs/intake_frontend.log" 2>&1 &
echo "$!" >> "$PID_FILE"
echo "    PID $!"

sleep 2

# -- MODULE 1 : Main Website --
echo "[1] Starting Main Website Backend   (Port 3000)..."
cd "$ROOT_DIR/1_main_website/backend"
DB_URL="$DB_URL" TOKEN_ENCRYPTION_KEY="$TOKEN_ENCRYPTION_KEY" nohup node index.js > "$ROOT_DIR/logs/main_backend.log" 2>&1 &
echo "$!" >> "$PID_FILE"
echo "    PID $!"

echo "[1] Starting Main Website Frontend  (Port 8081)..."
cd "$ROOT_DIR/1_main_website/frontend/adm-dashboard"
nohup node server.js > "$ROOT_DIR/logs/main_frontend.log" 2>&1 &
echo "$!" >> "$PID_FILE"
echo "    PID $!"

# -- Wait a moment then verify --
sleep 3
echo ""
echo "================================================="
echo "  SERVICE STATUS"
echo "================================================="

check_port() {
  local NAME=$1 PORT=$2
  if lsof -i:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "  [OK]   $NAME (Port $PORT)"
  else
    echo "  [WAIT] $NAME (Port $PORT) - check logs/$3"
  fi
}

check_port "Admin Backend"    3001 "admin_backend.log"
check_port "Admin Frontend"   3002 "admin_frontend.log"
check_port "Intake Backend"   8000 "intake_backend.log"
check_port "Intake Frontend"  5175 "intake_frontend.log"
check_port "Main Backend"     3000 "main_backend.log"
check_port "Main Frontend"    8081 "main_frontend.log"

# -- Get the EC2 private IP for display --
PRIVATE_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

echo ""
echo "================================================="
echo "  ACCESS URLS"
echo "================================================="
echo ""
echo "  Module 1 - Main Website"
echo "    Backend  : http://$PRIVATE_IP:3000"
echo "    Frontend : http://$PRIVATE_IP:8081"
echo ""
echo "  Module 2 - Admin Website"
echo "    Backend  : http://$PRIVATE_IP:3001"
echo "    Frontend : http://$PRIVATE_IP:3002"
echo ""
echo "  Module 3 - Intake Page"
echo "    Backend  : http://$PRIVATE_IP:8000"
echo "    Frontend : http://$PRIVATE_IP:5175"
echo ""
echo "  Nginx Reverse Proxy"
echo "    Entry Point : http://$PRIVATE_IP:5174"
echo "    All modules accessible via single port 5174"
echo ""
echo "  Intake Email URL : $INTAKE_BASE_URL"
echo ""
echo "  Logs      : $ROOT_DIR/logs/"
echo "  PID file  : $PID_FILE"
echo "  Stop all  : ./stop_all.sh"
echo "================================================="
echo ""

# ==============================================================
#  STEP 5: Deploy & Start Nginx Reverse Proxy
#  NOTE: Uses "dzdo -i" (root shell) because individual dzdo
#        commands are not permitted for nginx on this EC2.
# ==============================================================
echo "[NGINX] Setting up Nginx reverse proxy on port 5174..."

if [ -f "$ROOT_DIR/nginx/app-proxy.conf" ]; then
  echo "[NGINX] Deploying config and starting nginx via root shell..."

  dzdo -i bash <<NGINX_EOF
    # Install nginx if missing
    if ! command -v nginx >/dev/null 2>&1; then
      echo "[NGINX] Installing nginx..."
      apt update -qq && apt install -y nginx >/dev/null 2>&1
    fi

    # Deploy config
    cp "$ROOT_DIR/nginx/app-proxy.conf" /etc/nginx/conf.d/app-proxy.conf
    rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true

    # Validate
    if nginx -t 2>&1 | grep -q 'successful'; then
      echo "[NGINX] Config validation ✓"
      # Start or reload
      if systemctl is-active --quiet nginx 2>/dev/null; then
        nginx -s reload
        echo "[NGINX] Reloaded ✓"
      else
        systemctl start nginx 2>/dev/null || nginx
        echo "[NGINX] Started ✓"
      fi
    else
      echo "[NGINX] Config validation failed:"
      nginx -t
    fi
NGINX_EOF

  sleep 1

  # Health check (runs as normal user — just a curl)
  if command -v curl >/dev/null 2>&1; then
    HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:5174/nginx-health 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
      echo ""
      echo "================================================="
      echo "  ✅ NGINX REVERSE PROXY IS LIVE"
      echo "  Access everything at: http://$PRIVATE_IP:5174"
      echo ""
      echo "  Main Website : http://$PRIVATE_IP:5174/"
      echo "  Admin Panel  : http://$PRIVATE_IP:5174/admin/"
      echo "  Intake Portal: http://$PRIVATE_IP:5174/intake/"
      echo "  Health Check : http://$PRIVATE_IP:5174/nginx-health"
      echo "================================================="
    else
      echo ""
      echo "[NGINX] WARNING: Health check returned HTTP $HTTP_CODE"
      echo "  Run manually:  dzdo -i"
      echo "  Then inside root shell:"
      echo "    nginx -t"
      echo "    nginx -s reload"
    fi
  fi
else
  echo "[NGINX] WARNING: nginx/app-proxy.conf not found in project."
  echo "  Skipping nginx setup."
fi

