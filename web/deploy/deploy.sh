#!/usr/bin/env bash
# =============================================================================
# Stage website (Next.js) — build + deploy. Runs ON THE SERVER, from
# /var/www/events-ai/web, after the code is pushed to GitHub:
#
#   bash deploy/deploy.sh                 # pull, build, swap in, restart, verify
#   bash deploy/deploy.sh --rollback      # go back to the previous build
#   bash deploy/deploy.sh --status        # pm2 + local health checks only
#   SKIP_PULL=1    bash deploy/deploy.sh  # build what's on disk (no git)
#   FORCE_INSTALL=1 bash deploy/deploy.sh # npm ci even if the lockfile didn't move
#
# Usually driven from your laptop by `./deploy-web.sh` at the repo root.
#
# ---- Zero-downtime build -----------------------------------------------------
# The new version is built into `.next-build/` while the live site keeps
# serving `.next/`. Only a successful build is swapped in (old build kept as
# `.next-prev/`), then pm2 reloads. If the new version fails its checks it is
# rolled back automatically — a broken build never stays live.
# =============================================================================
set -euo pipefail

WEB_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$WEB_DIR/.." && pwd)"
APP_NAME="events-web"
BRANCH="${BRANCH:-main}"
LOG_DIR="/var/log/events-web"

MODE="deploy"
for arg in "$@"; do
  case "$arg" in
    --rollback) MODE="rollback" ;;
    --status)   MODE="status" ;;
    -h|--help)  sed -n '2,21p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "✗ unknown option: $arg"; exit 2 ;;
  esac
done

ok()   { printf '\033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '\033[33m·\033[0m %s\n' "$*"; }
die()  { printf '\033[31m✗\033[0m %s\n' "$*" >&2; exit 1; }
step() { printf '\n\033[1m→ %s\033[0m\n' "$*"; }

cd "$WEB_DIR"

# One deploy at a time — two builds racing over .next-build/ would corrupt it.
if command -v flock >/dev/null 2>&1; then
  exec 9>"/tmp/${APP_NAME}-deploy.lock"
  flock -n 9 || die "Another website deploy is already running."
fi

# ---- Settings ---------------------------------------------------------------
if [ ! -f .env.production ]; then
  cp .env.production.example .env.production
  warn "created web/.env.production from the example (PORT=8012, API on 127.0.0.1:8011) — edit it if this server differs"
fi
PORT="$(sed -n 's/^[[:space:]]*PORT[[:space:]]*=[[:space:]]*\([0-9]\{1,5\}\).*/\1/p' .env.production | tail -1)"
PORT="${PORT:-8012}"
BASE="http://127.0.0.1:$PORT"

pm2_has_app() { pm2 describe "$APP_NAME" >/dev/null 2>&1; }

restart_app() {
  mkdir -p "$LOG_DIR" 2>/dev/null || true
  if pm2_has_app; then
    pm2 reload "$APP_NAME" --update-env >/dev/null
  else
    pm2 start ecosystem.config.js --env production >/dev/null
  fi
  pm2 save >/dev/null
}

# Checks against the running site on this machine. Returns non-zero on failure.
smoke_test() {
  local failed=0 code
  for i in $(seq 1 15); do
    curl -fsS -o /dev/null "$BASE/" 2>/dev/null && break
    sleep 2
  done
  check() {
    local label="$1" path="$2" expect="$3"
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$BASE$path" || echo 000)
    if [ "$code" = "$expect" ]; then ok "$label ($code)"; else warn "$label returned $code, expected $expect"; failed=1; fi
  }
  check "home page"            "/"                     200
  check "discover"             "/events"               200
  check "alerts"               "/alerts"               200
  check "brand assets"         "/brand/app-icon.png"   200
  # Proves the /api proxy reaches the Stage API (API_BASE_URL is right).
  check "API through the site" "/api/health"           200
  # The page must come from the build just swapped in. Next.js embeds the
  # build ID in every page; a stale process (reload that didn't take) serves
  # the OLD id even when the source — and so every asset name — is identical.
  local build_id
  build_id="$(cat .next/BUILD_ID 2>/dev/null || true)"
  if [ -n "$build_id" ] && curl -s --max-time 20 "$BASE/" | grep -qF "$build_id"; then
    ok "serving build $build_id"
  else
    warn "the running site is NOT serving build ${build_id:-?} (stale process?)"; failed=1
  fi
  return $failed
}

# ---- Modes --------------------------------------------------------------------
if [ "$MODE" = "status" ]; then
  step "Status"
  pm2 describe "$APP_NAME" 2>/dev/null | sed -n '1,22p' || warn "$APP_NAME is not running under pm2"
  [ -f .next/BUILD_ID ] && ok "live build $(cat .next/BUILD_ID)"
  [ -f .next-prev/BUILD_ID ] && ok "previous build $(cat .next-prev/BUILD_ID) kept for rollback"
  smoke_test || true
  exit 0
fi

if [ "$MODE" = "rollback" ]; then
  step "Rolling back"
  [ -d .next-prev ] || die "No previous build (.next-prev) to roll back to."
  rm -rf .next-failed
  [ -d .next ] && mv .next .next-failed
  mv .next-prev .next
  [ -d .next-failed ] && mv .next-failed .next-prev   # so a second --rollback undoes this one
  restart_app
  smoke_test && ok "Rolled back — previous build is live on :$PORT" || die "Rolled back, but checks still fail — see: pm2 logs $APP_NAME --lines 80"
  exit 0
fi

# ---- 1. Preconditions ----------------------------------------------------------
step "Preflight"
command -v pm2 >/dev/null || die "pm2 not found in this shell."
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
[ "$NODE_MAJOR" -ge 20 ] || die "Next.js 16 needs Node 20.9+; this server has $(node -v 2>/dev/null || echo 'no node')."
ok "node $(node -v), port $PORT"
FREE_MB="$(df -Pm "$WEB_DIR" | awk 'NR==2 {print $4}')"
[ "${FREE_MB:-0}" -ge 1024 ] || warn "only ${FREE_MB}MB free disk — a build needs ~1GB"

# ---- 2. Pull --------------------------------------------------------------------
BEFORE="$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || echo none)"
if [ "${SKIP_PULL:-0}" != "1" ]; then
  step "Pull origin/$BRANCH"
  git -C "$REPO_ROOT" fetch --prune origin
  git -C "$REPO_ROOT" checkout -q "$BRANCH"
  # Same as the API deploy: the server mirrors the branch exactly.
  git -C "$REPO_ROOT" reset -q --hard "origin/$BRANCH"
fi
AFTER="$(git -C "$REPO_ROOT" rev-parse --short HEAD)"
[ "$BEFORE" = "$AFTER" ] && ok "at $AFTER (no new commits)" || ok "$BEFORE → $AFTER"
# ---- 3. Dependencies ---------------------------------------------------------------
# Decided from disk, not from this run's pull (the code may have been pulled by
# hand first — that's what bit the API deploy on 2026-11-08): install when
# node_modules is missing or the lockfile differs from the one last installed.
LOCK_HASH="$(sha1sum package-lock.json 2>/dev/null | cut -c1-40)"
LOCK_STAMP="node_modules/.deploy-lock-hash"
if [ "${FORCE_INSTALL:-0}" = "1" ] || [ ! -d node_modules/next ] || [ "$(cat "$LOCK_STAMP" 2>/dev/null)" != "$LOCK_HASH" ]; then
  step "npm ci"
  # Dev dependencies are build tools (TypeScript) — install them even if the
  # shell has NODE_ENV=production.
  npm ci --include=dev --no-audit --no-fund
  echo "$LOCK_HASH" > "$LOCK_STAMP"
else
  ok "dependencies unchanged — skipping npm ci"
fi

# ---- 4. Build beside the live site ----------------------------------------------------
step "Build (live site keeps serving while this runs)"
rm -rf .next-build
if ! NEXT_DIST_DIR=.next-build NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}" NEXT_TELEMETRY_DISABLED=1 npx --no-install next build; then
  rm -rf .next-build
  die "Build failed — nothing was changed; the current site is still live."
fi
ok "built $(cat .next-build/BUILD_ID)"
# Building into .next-build makes Next rewrite these two tracked files to point
# at it — put them back so the server's checkout stays clean between deploys.
git -C "$REPO_ROOT" checkout -- web/next-env.d.ts web/tsconfig.json 2>/dev/null || true

# ---- 5. Swap + restart -----------------------------------------------------------------
step "Swap in + restart $APP_NAME"
rm -rf .next-prev .next-failed
[ -d .next ] && mv .next .next-prev
mv .next-build .next
if pm2_has_app; then ACTION="reloaded"; else ACTION="started (first run)"; fi
restart_app
ok "pm2 $ACTION $APP_NAME"

# ---- 6. Verify (auto-rollback on failure) ------------------------------------------------
step "Verify on $BASE"
if smoke_test; then
  printf '\n'
  ok "Website $AFTER live on :$PORT (previous build kept — rollback: bash deploy/deploy.sh --rollback)"
  exit 0
fi

if [ -d .next-prev ]; then
  warn "checks failed — rolling back to the previous build"
  rm -rf .next-failed && mv .next .next-failed && mv .next-prev .next
  restart_app
  smoke_test >/dev/null 2>&1 && warn "previous build restored and healthy" || warn "previous build restored, but it fails too"
  die "Deploy of $AFTER rolled back. The failed build is in web/.next-failed — inspect with: pm2 logs $APP_NAME --lines 80"
fi
die "Checks failed and there is no previous build to fall back to (first deploy). See: pm2 logs $APP_NAME --lines 80"
