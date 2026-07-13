#!/bin/bash
# ================================================================
#  ADM Analytics Platform - Stop All Services
#  Usage:  chmod +x stop_all.sh && ./stop_all.sh
# ================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$ROOT_DIR/logs/pids.txt"

echo ""
echo "================================================="
echo "   ADM Analytics Platform - Stopping All Services"
echo "================================================="
echo ""

# Method 1: Kill from PID file
if [ -f "$PID_FILE" ]; then
  while read -r pid; do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo "  Killing PID $pid..."
      kill "$pid" 2>/dev/null || true
    fi
  done < "$PID_FILE"
  > "$PID_FILE"
fi

# Method 2: Kill by port (fallback)
kill_port() {
  PORT=$1
  PID=$(lsof -t -i:"$PORT" 2>/dev/null || true)
  if [ -n "$PID" ]; then
    echo "  Killing process on port $PORT (PID $PID)..."
    kill -9 $PID 2>/dev/null || true
  fi
}

for port in 3001 3002 8000 5174 5175 3000 8081; do
  kill_port $port
done

# Stop Nginx
if command -v nginx >/dev/null 2>&1; then
  if systemctl is-active --quiet nginx 2>/dev/null; then
    echo "  Stopping Nginx..."
    dzdo -i bash -c "systemctl stop nginx 2>/dev/null || nginx -s stop 2>/dev/null || true"
  fi
fi

echo ""
echo "  All services stopped."
echo "================================================="
