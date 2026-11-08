#!/usr/bin/env bash
# =============================================================================
# Stage — deploy the backend to the live server, from your laptop.
#
#   ./deploy.sh                 deploy the backend, then verify it from outside
#   ./deploy.sh --status        health + pm2 status, deploy nothing
#   ./deploy.sh --logs [N]      tail the last N remote log lines (default 80)
#   ./deploy.sh --shell         drop into a shell in the app container
#   ./deploy.sh --branch NAME   deploy a branch other than main
#   ./deploy.sh --force         deploy with uncommitted local changes
#   ./deploy.sh --skip-install  don't run npm ci on the server
#
# What actually happens:
#
#   laptop ──gcloud ssh (IAP)──▶ VM ──docker exec──▶ container
#                                                        │
#                     /var/www/events-ai/backend/deploy/deploy.sh
#                       git pull → npm ci → prisma generate
#                       → prisma db push → pm2 reload → smoke tests
#
# The server pulls from GitHub — it never receives your working tree. So the
# pre-flight below refuses to deploy work that isn't pushed: committing is not
# shipping, and a deploy that silently ships the previous commit is worse than
# one that stops.
#
# Requires: gcloud CLI authenticated (`gcloud auth login`) and
# backend/deploy/.deploy-config filled in (copy the .example).
#
# This deploys the BACKEND ONLY. The mobile app ships as an APK — see
# docs/PUSH-NOTIFICATIONS.md and the release notes.
# =============================================================================
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="$HERE/backend/deploy"
CONFIG="$DEPLOY_DIR/.deploy-config"

BRANCH_OVERRIDE=""
FORCE=0
MODE="deploy"
LOG_LINES=80
SKIP_INSTALL_FLAG=0

while [ $# -gt 0 ]; do
  case "$1" in
    --status) MODE="status" ;;
    --shell)  MODE="shell" ;;
    --logs)   MODE="logs"; if [ "${2:-}" ] && [ -z "${2##[0-9]*}" ]; then LOG_LINES="$2"; shift; fi ;;
    --branch) BRANCH_OVERRIDE="${2:?--branch needs a name}"; shift ;;
    --force)  FORCE=1 ;;
    --skip-install) SKIP_INSTALL_FLAG=1 ;;
    -h|--help) sed -n '2,32p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "✗ unknown option: $1  (try --help)"; exit 2 ;;
  esac
  shift
done

say()  { printf '%s\n' "$*"; }
ok()   { printf '\033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '\033[33m·\033[0m %s\n' "$*"; }
die()  { printf '\033[31m✗\033[0m %s\n' "$*" >&2; exit 1; }
rule() { printf '\n\033[2m%s\033[0m\n' "────────────────────────────────────────────────────────"; }

# ---- Running ON the server? Hand straight to the server-side script. -------
if [ ! -f "$CONFIG" ] && ! command -v gcloud >/dev/null 2>&1 && [ -f "$DEPLOY_DIR/deploy.sh" ]; then
  export BRANCH="${BRANCH_OVERRIDE:-$(git -C "$HERE" branch --show-current)}"
  say "On the server — running backend/deploy/deploy.sh for branch $BRANCH"
  case "$MODE" in
    logs)   exec pm2 logs events-ai --lines "$LOG_LINES" --nostream ;;
    status) exec pm2 describe events-ai ;;
    shell)  exec bash ;;
  esac
  cd "$HERE/backend"
  [ "$SKIP_INSTALL_FLAG" = "1" ] && export SKIP_INSTALL=1
  exec bash deploy/deploy.sh
fi

# ---- Config -----------------------------------------------------------------

[ -f "$CONFIG" ] || die "Missing $CONFIG — copy it from .deploy-config.example and fill it in."
# shellcheck disable=SC1090
source "$CONFIG"

BRANCH="${BRANCH_OVERRIDE:-${BRANCH:-main}}"
APP_DIR="${APP_DIR:-/var/www/events-ai}"
# Public hostname used for the post-deploy checks. Override in .deploy-config.
PUBLIC_URL="${PUBLIC_URL:-https://events-api.aahaas.com}"

CONNECT="$DEPLOY_DIR/gcloud-connect.sh"
remote() { "$CONNECT" "$@"; }

# ---- Non-deploy modes -------------------------------------------------------

case "$MODE" in
  shell)
    exec "$CONNECT"
    ;;
  logs)
    exec "$CONNECT" "pm2 logs events-ai --lines $LOG_LINES --nostream"
    ;;
  status)
    rule
    say "Live checks — $PUBLIC_URL"
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$PUBLIC_URL/api/health" || echo 000)
    [ "$code" = "200" ] && ok "health 200" || warn "health $code"
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$PUBLIC_URL/api/notifications" || echo 000)
    [ "$code" = "200" ] && ok "alerts feed 200" || warn "alerts feed $code"
    rule
    exec "$CONNECT" "pm2 describe events-ai | sed -n '1,25p'"
    ;;
esac

# ---- Pre-flight -------------------------------------------------------------

rule
say "Pre-flight"

command -v gcloud >/dev/null 2>&1 || die "gcloud is not on PATH. Install the Cloud SDK, then \`gcloud auth login\`."

if ! gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null | grep -q .; then
  die "No active gcloud account. Run: gcloud auth login"
fi
ok "gcloud authenticated as $(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null | head -1)"

cd "$HERE"

# Uncommitted work is invisible to the server — it deploys from GitHub.
DIRTY="$(git status --porcelain --untracked-files=no)"
if [ -n "$DIRTY" ]; then
  if [ "$FORCE" = "1" ]; then
    warn "working tree is dirty — deploying anyway (--force). These changes will NOT ship:"
    printf '%s\n' "$DIRTY" | sed 's/^/      /'
  else
    say ""
    die "Working tree has uncommitted changes. The server deploys from GitHub, so these would not ship:
$(printf '%s\n' "$DIRTY" | sed 's/^/      /')

  Commit and push them, or re-run with --force if you meant to leave them behind."
  fi
else
  ok "working tree clean"
fi

say "→ fetching origin/$BRANCH…"
git fetch --quiet origin "$BRANCH" || die "Could not fetch origin/$BRANCH."

git rev-parse --verify --quiet "origin/$BRANCH" >/dev/null || die "origin/$BRANCH does not exist."

# The check that catches "I committed it, why isn't it live": your current
# commit has to actually be reachable from the branch the server pulls.
if ! git merge-base --is-ancestor HEAD "origin/$BRANCH" 2>/dev/null; then
  CURRENT="$(git rev-parse --abbrev-ref HEAD)"
  die "HEAD ($CURRENT @ $(git rev-parse --short HEAD)) is not on origin/$BRANCH.
  The server would deploy origin/$BRANCH @ $(git rev-parse --short "origin/$BRANCH") — not your work.

  Either push this branch and merge it into $BRANCH, or deploy it directly:
      ./deploy.sh --branch $CURRENT"
fi
ok "HEAD is on origin/$BRANCH ($(git rev-parse --short "origin/$BRANCH"))"

# Tell them exactly what is going out, before it goes out.
say ""
say "Target:   ${INSTANCE:-?} / ${CONTAINER:-?} : $APP_DIR"
say "Branch:   $BRANCH @ $(git rev-parse --short "origin/$BRANCH")"
say "Commit:   $(git log -1 --format='%s' "origin/$BRANCH")"

# ---- Deploy -----------------------------------------------------------------

rule
say "Deploying"

ENV_FORWARD="BRANCH='$BRANCH' "
[ "$SKIP_INSTALL_FLAG" = "1" ] && ENV_FORWARD+="SKIP_INSTALL=1 "

if ! remote "cd $APP_DIR/backend && $ENV_FORWARD ./deploy/deploy.sh"; then
  rule
  die "Remote deploy failed. Inspect with:
      ./deploy.sh --logs
      ./deploy.sh --shell"
fi

# ---- Verify from outside ----------------------------------------------------
# The server checked itself on 127.0.0.1. This checks the path a phone
# actually takes — Cloudflare → nginx → node — which can be broken while
# every local check passes.

rule
say "Verifying $PUBLIC_URL"

check_url() {
  local label="$1" path="$2" expect="$3"
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$PUBLIC_URL$path" || echo 000)
  if [ "$code" = "$expect" ]; then
    ok "$label ($code)"
    return 0
  fi
  warn "$label returned $code, expected $expect"
  return 1
}

FAILED=0
check_url "health" "/api/health" "200" || FAILED=1
check_url "alerts feed" "/api/notifications" "200" || FAILED=1
# 404 = the route is mounted AND PushDevice is queryable. A 500 here is the
# signature of a schema sync that didn't happen.
check_url "push device registry" "/api/notifications/devices/deploy-smoke-check" "404" || FAILED=1

rule
if [ "$FAILED" = "1" ]; then
  say "Deploy finished, but a public check did not look right."
  say "  ./deploy.sh --logs     recent server logs"
  say "  ./deploy.sh --status   re-run the checks"
  exit 1
fi

ok "Backend live at $PUBLIC_URL"
say ""
say "Reminder: this deployed the BACKEND only."
say "The app changes (push registration, the Alerts toggle, the notification"
say "icon) need an APK rebuild — the Android manifest and drawables changed,"
say "so \`eas update\` will not carry them:"
say ""
say "    cd Project/android && ./gradlew assembleRelease"
say "    # or: cd Project && npx eas build --profile preview --platform android"
