#!/usr/bin/env bash
# =============================================================================
# EventSocial backend — incremental deploy. Runs ON THE SERVER.
#
# From /var/www/events-ai/backend, after `git push`:
#
#   ./deploy/deploy.sh                # full update
#   SKIP_INSTALL=1 ./deploy/deploy.sh # skip npm ci (no dep change)
#   SKIP_DB=1 ./deploy/deploy.sh      # skip the schema sync
#
# Usually you don't run this by hand — `./deploy.sh` at the repo root drives
# it from your laptop through the gcloud/IAP chain.
#
# Designed to be safe to re-run. Reverts the working tree to the latest
# branch head; `git stash` first if you have local edits worth keeping.
#
# ---- On the schema -----------------------------------------------------------
# This project syncs the database with `prisma db push`, NOT `migrate deploy`:
# there is one migration (the init) and every schema change since has been
# pushed. `migrate deploy` here is a silent no-op — it would report success
# while leaving new tables uncreated, and the app would 500 on first use.
#
# `db push` runs WITHOUT `--accept-data-loss`, so an additive change (a new
# table, a nullable column) applies cleanly and anything that would drop data
# aborts the deploy instead. That's the intended safety line: destructive
# schema changes are a human decision, not a deploy step.
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

# ---- 2. Dependencies + Prisma client ---------------------------------------
# What needs doing is decided from the STATE ON DISK, never from "what did
# this run's git pull change": if the code was pulled by hand first, the pull
# here sees no change — and the 2026-11-08 deploy then skipped generate + db
# push and reloaded new code against a database without its tables.

# npm ci only when the lockfile differs from the one last installed here.
LOCK_HASH="$(sha1sum package-lock.json 2>/dev/null | cut -c1-40)"
LOCK_STAMP="node_modules/.deploy-lock-hash"
if [ "${SKIP_INSTALL:-0}" = "1" ]; then
  echo "→ SKIP_INSTALL=1 — not touching node_modules"
elif [ ! -d node_modules ]; then
  echo "→ no node_modules — npm ci…"
  npm ci && echo "$LOCK_HASH" > "$LOCK_STAMP"
elif [ ! -f "$LOCK_STAMP" ]; then
  # First run with this check: trust what's installed and start tracking it.
  echo "$LOCK_HASH" > "$LOCK_STAMP"
  echo "→ dependencies: now tracking package-lock.json"
elif [ "$(cat "$LOCK_STAMP")" != "$LOCK_HASH" ]; then
  echo "→ package-lock.json changed since the last install — npm ci…"
  npm ci && echo "$LOCK_HASH" > "$LOCK_STAMP"
else
  echo "→ dependencies up to date"
fi

# Always regenerate the client: a couple of seconds, never a database write,
# and the client must know every model in the schema on disk.
echo "→ prisma generate…"
npx --no-install prisma generate

# ---- 3. Schema sync ---------------------------------------------------------
# Always, before the restart: the new process must not boot against a database
# that is missing the tables its queries name. `db push` is a no-op when the
# database already matches. No --accept-data-loss: an additive change (new
# table / nullable column) applies, anything destructive aborts the deploy.
if [ "${SKIP_DB:-0}" != "1" ]; then
  echo "→ prisma db push (syncs only if the schema moved)…"
  if ! npx --no-install prisma db push --skip-generate; then
    echo ""
    echo "✗ db push failed. If it refused because the change would drop data,"
    echo "  that refusal is deliberate — review it and apply it by hand:"
    echo "    cd $APP_DIR && npx --no-install prisma db push"
    echo "  The old code is still running and healthy; nothing was restarted."
    exit 1
  fi
else
  echo "→ SKIP_DB=1 — NOT syncing the schema (you're on your own)"
fi

# ---- 4. Restart under PM2 ---------------------------------------------------
echo "→ pm2 reload…"
pm2 reload ecosystem.config.js --env production --update-env
pm2 save

# ---- 5. Smoke test ----------------------------------------------------------
# The port lives in the app's .env (8011 here — 8000 is owned by another app
# in this container), so read it from there rather than guessing.
detect_port() {
  local p=""
  if [ -f "$APP_DIR/.env" ]; then
    p="$(sed -n 's/^[[:space:]]*PORT[[:space:]]*=[[:space:]]*\([0-9]\{1,5\}\).*/\1/p' "$APP_DIR/.env" | tail -1)"
  fi
  echo "${p:-${PORT:-8000}}"
}
APP_PORT="$(detect_port)"
BASE="http://127.0.0.1:$APP_PORT"

echo "→ health check on :$APP_PORT…"
sleep 2

healthy=0
for i in 1 2 3 4 5; do
  if curl -fsS "$BASE/api/health" >/dev/null 2>&1; then
    echo "✓ health OK (try $i)"
    healthy=1
    break
  fi
  sleep 2
done

if [ "$healthy" != "1" ]; then
  echo "✗ health check failed after 10s at $BASE/api/health"
  echo "    pm2 logs $APP_NAME --lines 80"
  exit 1
fi

# A 404 here proves two things at once: the notifications routes are mounted,
# and PushDevice is queryable. A 500 would mean the table isn't there — which
# is exactly what a skipped schema sync looks like from the outside.
DEVICE_CODE=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/notifications/devices/deploy-smoke-check" || echo 000)
case "$DEVICE_CODE" in
  404) echo "✓ push device registry live" ;;
  500) echo "✗ push routes are up but the database is missing PushDevice —"
       echo "  run: cd $APP_DIR && npx --no-install prisma db push"
       exit 1 ;;
  *)   echo "· push device registry returned $DEVICE_CODE (expected 404)" ;;
esac

if curl -fsS "$BASE/api/notifications" >/dev/null 2>&1; then
  echo "✓ alerts feed responding"
else
  echo "· alerts feed did not respond — check pm2 logs $APP_NAME"
fi

# The scheduler announces itself on boot. Its absence means push reminders
# won't go out, even though every HTTP check above passed.
if pm2 logs "$APP_NAME" --lines 60 --nostream 2>/dev/null | grep -q "push:scheduler"; then
  echo "✓ push scheduler running"
else
  echo "· push scheduler not seen in recent logs (PUSH_SCHEDULER_ENABLED=false?)"
fi

echo ""
echo "Deployed $APP_NAME → $AFTER on :$APP_PORT"
