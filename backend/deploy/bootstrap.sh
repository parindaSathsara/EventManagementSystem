#!/usr/bin/env bash
# =============================================================================
# EventSocial backend — one-time bootstrap.
#
# Run ONCE on the remote (inside the aahaas-workspace-1 container, as root):
#
#   cd /var/www
#   git clone <repo-url> events-ai
#   cd events-ai/backend
#   ./deploy/bootstrap.sh
#
# Re-running is safe — every step is idempotent.
# =============================================================================
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"     # absolute path of backend/
APP_NAME="events-ai"
LOG_DIR="/var/log/${APP_NAME}"
UPLOAD_DIR="${APP_DIR}/uploads"

cd "$APP_DIR"

# ---- 1. Tooling checks ------------------------------------------------------
need() { command -v "$1" >/dev/null 2>&1 || { echo "✗ missing: $1"; exit 1; }; }

echo "→ checking tooling…"
need node
need npm

NODE_MAJOR=$(node -v | sed -E 's/v([0-9]+).*/\1/')
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "✗ Node 20+ required, found $(node -v)"
  echo "  Install with:"
  echo "    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
  echo "    apt-get install -y nodejs"
  exit 1
fi
echo "  node $(node -v)  npm $(npm -v)"

if ! command -v pm2 >/dev/null 2>&1; then
  echo "→ installing pm2 globally…"
  npm install -g pm2
fi
echo "  pm2 $(pm2 --version)"

# ---- 2. .env ----------------------------------------------------------------
if [ ! -f .env ]; then
  if [ -f .env.production.example ]; then
    cp .env.production.example .env
    echo "✓ created .env from .env.production.example"
    echo "  ⚠  Edit .env now (DATABASE_URL, JWT_SECRET, PUBLIC_BASE_URL, CORS_ORIGINS)"
    echo "      then re-run this script."
    exit 1
  else
    echo "✗ no .env and no .env.production.example to copy from"; exit 1
  fi
fi
echo "✓ .env present"

# ---- 3. Log directory + upload directory ------------------------------------
mkdir -p "$LOG_DIR" "$UPLOAD_DIR"
chmod 755 "$LOG_DIR" "$UPLOAD_DIR"
echo "✓ log dir:    $LOG_DIR"
echo "✓ upload dir: $UPLOAD_DIR"

# ---- 4. Install deps + generate Prisma client -------------------------------
if [ -f package-lock.json ]; then
  echo "→ npm ci (reproducible install from package-lock.json)…"
  npm ci
else
  # No lockfile shipped — fall back to a regular install. Should be a
  # one-time path on first ever deploy; subsequent deploys will use ci.
  echo "→ no package-lock.json found; running npm install instead…"
  npm install
fi

echo "→ prisma generate…"
npx prisma generate

# ---- 5. Migrate the database ------------------------------------------------
echo "→ prisma migrate deploy…"
npx prisma migrate deploy

# ---- 6. Optional seed (idempotent — safe to re-run) -------------------------
if [ "${SEED:-no}" = "yes" ]; then
  echo "→ npm run db:seed…"
  npm run db:seed
fi

# ---- 7. Start under PM2 -----------------------------------------------------
echo "→ pm2 start…"
pm2 startOrReload ecosystem.config.js --env production
pm2 save

# ---- 8. PM2 startup on reboot ----------------------------------------------
# Inside a container this is mostly a no-op; on the host it'd hook into
# systemd. Either way `pm2 save` + the supervisor/host's own restart policy
# is what brings us back. Print the command in case it's useful.
echo ""
echo "ℹ  If this host owns its own init system, persist PM2 with:"
echo "     pm2 startup systemd -u $(id -un) --hp $HOME"
echo ""

# ---- 9. Smoke test ----------------------------------------------------------
sleep 2
HEALTH_URL="http://127.0.0.1:${PORT:-8000}/api/health"
if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
  echo "✓ health OK at $HEALTH_URL"
else
  echo "✗ health check failed at $HEALTH_URL"
  echo "  pm2 logs events-ai --lines 50"
  exit 1
fi

echo ""
echo "──────────────────────────────────────────────────────────────"
echo " EventSocial backend is live."
echo "   local:   $HEALTH_URL"
echo "   public:  (configure nginx — see deploy/nginx/events-api.conf)"
echo "   logs:    pm2 logs ${APP_NAME}"
echo "   status:  pm2 status"
echo "   update:  ./deploy/deploy.sh"
echo "──────────────────────────────────────────────────────────────"
