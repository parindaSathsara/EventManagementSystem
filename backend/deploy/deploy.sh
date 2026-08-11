#!/usr/bin/env bash
# =============================================================================
# EventSocial backend — incremental deploy.
#
# Run from /var/www/events-ai/backend on the remote, after `git push`:
#
#   ./deploy/deploy.sh                # full update
#   SKIP_INSTALL=1 ./deploy/deploy.sh # skip npm ci (no dep change)
#
# Designed to be safe to re-run. Reverts the working tree to the latest
# main; do `git stash` first if you have local edits worth keeping.
#
# Database migrations are NOT part of this script — deploying code and
# changing the database are separate decisions, and a half-applied migration
# used to abort the whole deploy. When `prisma/schema.prisma` changes, the
# script says so and you run the migration yourself:
#
#   cd /var/www/events-ai/backend && npx prisma migrate deploy
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

# Did this pull change the database schema? Used for the reminder at the end —
# nothing here touches the database.
SCHEMA_CHANGED=0
if git -C "$REPO_ROOT" diff --name-only "$BEFORE" "$AFTER" 2>/dev/null | grep -q "backend/prisma/schema.prisma"; then
  SCHEMA_CHANGED=1
fi

# ---- 2. Install deps if package-lock changed -------------------------------
if [ "${SKIP_INSTALL:-0}" != "1" ]; then
  if git diff --name-only "$BEFORE" "$AFTER" 2>/dev/null | grep -qE "backend/(package(-lock)?\.json|prisma/schema\.prisma)$"; then
    echo "→ package files changed — running npm ci + prisma generate…"
    npm ci
    npx prisma generate
  else
    echo "→ no dep changes; skipping npm ci (use SKIP_INSTALL=1 to force)"
    # Still regenerate the client if schema changed but lock didn't. This is
    # code generation, not a migration — it never touches the database.
    if [ "$SCHEMA_CHANGED" = "1" ]; then
      npx prisma generate
    fi
  fi
else
  echo "→ skipping install (SKIP_INSTALL=1)"
fi

# ---- 3. Restart under PM2 ---------------------------------------------------
echo "→ pm2 reload…"
pm2 reload ecosystem.config.js --env production
pm2 save

# ---- 4. Smoke test ----------------------------------------------------------
sleep 2
HEALTH_URL="http://127.0.0.1:${PORT:-8000}/api/health"

# Loud, unmissable reminder — the deploy no longer migrates for you, so a
# schema change that isn't applied by hand means the code is now running
# against a database that doesn't match it.
schema_notice() {
  if [ "$SCHEMA_CHANGED" = "1" ]; then
    echo ""
    echo "!!  prisma/schema.prisma changed in this deploy."
    echo "!!  Migrations are NOT run automatically — apply it yourself:"
    echo "!!    cd $APP_DIR && npx prisma migrate status"
    echo "!!    cd $APP_DIR && npx prisma migrate deploy"
  fi
}

for i in 1 2 3 4 5; do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    echo "✓ health OK at $HEALTH_URL (try $i)"
    echo ""
    echo "Deployed $APP_NAME → $AFTER"
    schema_notice
    exit 0
  fi
  sleep 2
done

schema_notice

echo "✗ health check failed after 10s. Investigate:"
echo "    pm2 logs $APP_NAME --lines 80"
exit 1
