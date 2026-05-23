#!/usr/bin/env bash
# =============================================================================
# EventSocial backend — incremental deploy.
#
# Run from /var/www/events-ai/backend on the remote, after `git push`:
#
#   ./deploy/deploy.sh                # full update
#   SKIP_MIGRATE=1 ./deploy/deploy.sh # skip prisma migrate (no schema change)
#   SKIP_INSTALL=1 ./deploy/deploy.sh # skip npm ci (no dep change)
#
# Designed to be safe to re-run. Reverts the working tree to the latest
# main; do `git stash` first if you have local edits worth keeping.
# =============================================================================
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$APP_DIR/.." && pwd)"
APP_NAME="events-ai"
BRANCH="${BRANCH:-main}"

cd "$REPO_ROOT"

# ---- 1. Pull latest ---------------------------------------------------------
echo "→ git fetch + checkout $BRANCH…"
git fetch --prune origin
git checkout "$BRANCH"

BEFORE=$(git rev-parse --short HEAD)
git reset --hard "origin/$BRANCH"
AFTER=$(git rev-parse --short HEAD)

if [ "$BEFORE" = "$AFTER" ]; then
  echo "  already at $AFTER — nothing to pull, continuing anyway"
else
  echo "  $BEFORE → $AFTER"
fi

cd "$APP_DIR"

# ---- 2. Install deps if package-lock changed -------------------------------
if [ "${SKIP_INSTALL:-0}" != "1" ]; then
  if git diff --name-only "$BEFORE" "$AFTER" 2>/dev/null | grep -qE "backend/(package(-lock)?\.json|prisma/schema\.prisma)$"; then
    echo "→ package files changed — running npm ci + prisma generate…"
    npm ci
    npx prisma generate
  else
    echo "→ no dep changes; skipping npm ci (use SKIP_INSTALL=1 to force)"
    # Still regenerate the client if schema changed but lock didn't.
    if git diff --name-only "$BEFORE" "$AFTER" 2>/dev/null | grep -q "backend/prisma/schema.prisma"; then
      npx prisma generate
    fi
  fi
else
  echo "→ skipping install (SKIP_INSTALL=1)"
fi

# ---- 3. Migrate -------------------------------------------------------------
if [ "${SKIP_MIGRATE:-0}" != "1" ]; then
  echo "→ prisma migrate deploy…"
  npx prisma migrate deploy
else
  echo "→ skipping migrate (SKIP_MIGRATE=1)"
fi

# ---- 4. Restart under PM2 ---------------------------------------------------
echo "→ pm2 reload…"
pm2 reload ecosystem.config.js --env production
pm2 save

# ---- 5. Smoke test ----------------------------------------------------------
sleep 2
HEALTH_URL="http://127.0.0.1:${PORT:-8000}/api/health"
for i in 1 2 3 4 5; do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    echo "✓ health OK at $HEALTH_URL (try $i)"
    echo ""
    echo "Deployed $APP_NAME → $AFTER"
    exit 0
  fi
  sleep 2
done

echo "✗ health check failed after 10s. Investigate:"
echo "    pm2 logs $APP_NAME --lines 80"
exit 1
