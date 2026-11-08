#!/usr/bin/env bash
# =============================================================================
# Stage — deploy the WEBSITE (Next.js, web/) to the live server, from your laptop.
#
#   ./deploy-web.sh                  build on the server, swap in, verify
#   ./deploy-web.sh --status         pm2 + health checks, deploy nothing
#   ./deploy-web.sh --logs [N]       last N lines of the website's server log (default 80)
#   ./deploy-web.sh --rollback       put the previous build back live
#   ./deploy-web.sh --branch NAME    deploy a branch other than main
#   ./deploy-web.sh --force          deploy with uncommitted local changes
#   ./deploy-web.sh --install        force npm ci on the server
#
# What actually happens:
#
#   laptop ──gcloud ssh (IAP)──▶ VM ──docker exec──▶ workspace container
#                                                        │
#                         /var/www/events-ai/web/deploy/deploy.sh
#                           git pull → npm ci (if deps moved) → next build
#                           into .next-build/ (live site untouched) → swap
#                           → pm2 reload events-web → checks → auto-rollback
#
# Same server, same connection and the same backend/deploy/.deploy-config as
# ./deploy.sh (which deploys the API). The server pulls from GitHub, so only
# PUSHED commits ship — the pre-flight below refuses anything else.
#
# One-time server setup (first deploy does most of it automatically):
#   - web/.env.production is created from web/.env.production.example
#     (PORT=8012, API reached on 127.0.0.1:8011) — edit on the server if needed.
#   - nginx: point the website's domain at the container — see
#     web/deploy/nginx/events-web.workspace.conf.
#   - Set WEB_PUBLIC_URL in backend/deploy/.deploy-config to check the public site.
# =============================================================================
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="$HERE/backend/deploy"
CONFIG="$DEPLOY_DIR/.deploy-config"

BRANCH_OVERRIDE=""
FORCE=0
MODE="deploy"
LOG_LINES=80
FORCE_INSTALL=0

while [ $# -gt 0 ]; do
  case "$1" in
    --status)   MODE="status" ;;
    --rollback) MODE="rollback" ;;
    --logs)     MODE="logs"; if [ "${2:-}" ] && [ -z "${2##[0-9]*}" ]; then LOG_LINES="$2"; shift; fi ;;
    --branch)   BRANCH_OVERRIDE="${2:?--branch needs a name}"; shift ;;
    --force)    FORCE=1 ;;
    --install)  FORCE_INSTALL=1 ;;
    -h|--help)  sed -n '2,31p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "✗ unknown option: $1  (try --help)"; exit 2 ;;
  esac
  shift
done

say()  { printf '%s\n' "$*"; }
ok()   { printf '\033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '\033[33m·\033[0m %s\n' "$*"; }
die()  { printf '\033[31m✗\033[0m %s\n' "$*" >&2; exit 1; }
rule() { printf '\n\033[2m%s\033[0m\n' "────────────────────────────────────────────────────────"; }

# ---- Config -----------------------------------------------------------------

[ -f "$CONFIG" ] || die "Missing $CONFIG — copy it from .deploy-config.example and fill it in."
# shellcheck disable=SC1090
source "$CONFIG"

BRANCH="${BRANCH_OVERRIDE:-${BRANCH:-main}}"
APP_DIR="${APP_DIR:-/var/www/events-ai}"
WEB_PUBLIC_URL="${WEB_PUBLIC_URL:-}"

CONNECT="$DEPLOY_DIR/gcloud-connect.sh"
remote() { bash "$CONNECT" "$@"; }
SERVER_SCRIPT="cd $APP_DIR/web && bash deploy/deploy.sh"

public_checks() {
  [ -n "$WEB_PUBLIC_URL" ] || { warn "WEB_PUBLIC_URL not set in .deploy-config — skipping the public check"; return 0; }
  rule
  say "Verifying $WEB_PUBLIC_URL (Cloudflare → nginx → website)"
  local failed=0 code
  for path in "/" "/events" "/api/health"; do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$WEB_PUBLIC_URL$path" || echo 000)
    if [ "$code" = "200" ]; then ok "$path ($code)"; else warn "$path returned $code"; failed=1; fi
  done
  return $failed
}

# ---- Non-deploy modes -------------------------------------------------------

case "$MODE" in
  logs)
    exec bash "$CONNECT" "pm2 logs events-web --lines $LOG_LINES --nostream"
    ;;
  status)
    remote "$SERVER_SCRIPT --status"
    public_checks || true
    exit 0
    ;;
  rollback)
    rule
    say "Rolling the website back to its previous build"
    remote "$SERVER_SCRIPT --rollback" || die "Rollback failed — ./deploy-web.sh --logs"
    public_checks || true
    exit 0
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

DIRTY="$(git status --porcelain --untracked-files=no -- web)"
if [ -n "$DIRTY" ]; then
  if [ "$FORCE" = "1" ]; then
    warn "web/ has uncommitted changes — deploying anyway (--force). These will NOT ship:"
    printf '%s\n' "$DIRTY" | sed 's/^/      /'
  else
    die "web/ has uncommitted changes. The server builds from GitHub, so these would not ship:
$(printf '%s\n' "$DIRTY" | sed 's/^/      /')

  Commit and push them, or re-run with --force if you meant to leave them behind."
  fi
else
  ok "web/ is committed"
fi

say "→ fetching origin/$BRANCH…"
git fetch --quiet origin "$BRANCH" || die "Could not fetch origin/$BRANCH."
git rev-parse --verify --quiet "origin/$BRANCH" >/dev/null || die "origin/$BRANCH does not exist."

if ! git merge-base --is-ancestor HEAD "origin/$BRANCH" 2>/dev/null; then
  CURRENT="$(git rev-parse --abbrev-ref HEAD)"
  die "HEAD ($CURRENT @ $(git rev-parse --short HEAD)) is not on origin/$BRANCH.
  The server would build origin/$BRANCH @ $(git rev-parse --short "origin/$BRANCH") — not your work.

  Push this branch and merge it into $BRANCH, or deploy it directly:
      ./deploy-web.sh --branch $CURRENT"
fi
ok "HEAD is on origin/$BRANCH ($(git rev-parse --short "origin/$BRANCH"))"

git cat-file -e "origin/$BRANCH:web/deploy/deploy.sh" 2>/dev/null || \
  die "origin/$BRANCH has no web/deploy/deploy.sh yet — commit and push the deploy files first."

say ""
say "Target:   ${INSTANCE:-?} / ${CONTAINER:-?} : $APP_DIR/web  (pm2: events-web)"
say "Branch:   $BRANCH @ $(git rev-parse --short "origin/$BRANCH")"
say "Commit:   $(git log -1 --format='%s' "origin/$BRANCH")"

# ---- Deploy -----------------------------------------------------------------

rule
say "Building + deploying on the server (the live site keeps serving until the swap)"

ENV_FORWARD="BRANCH='$BRANCH' "
[ "$FORCE_INSTALL" = "1" ] && ENV_FORWARD+="FORCE_INSTALL=1 "

if ! remote "cd $APP_DIR/web && $ENV_FORWARD bash deploy/deploy.sh"; then
  rule
  die "Website deploy did not complete (a failed build changes nothing; failed checks roll back).
      ./deploy-web.sh --logs     server log
      ./deploy-web.sh --status   current state"
fi

if ! public_checks; then
  rule
  say "Deployed and healthy on the server, but the public URL didn't look right —"
  say "check the nginx site for the website domain (web/deploy/nginx/) and Cloudflare."
  exit 1
fi

rule
ok "Website live${WEB_PUBLIC_URL:+ at $WEB_PUBLIC_URL}"
say "  Undo with: ./deploy-web.sh --rollback"
