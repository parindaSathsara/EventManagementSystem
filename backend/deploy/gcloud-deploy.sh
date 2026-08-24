#!/usr/bin/env bash
# =============================================================================
# One-command deploy from your laptop, all the way to a live restart.
#
#   ./deploy/gcloud-deploy.sh                    # standard deploy
#   BRANCH=hotfix ./deploy/gcloud-deploy.sh      # deploy a non-main branch
#   SKIP_INSTALL=1 ./deploy/gcloud-deploy.sh     # skip npm ci
#
# Prefer `./deploy.sh` at the repo root — same thing, plus the pre-flight that
# refuses to deploy work you haven't pushed, and post-deploy checks against the
# public hostname. This script is the transport underneath it.
#
# What it does:
#   1. `gcloud compute ssh` (via IAP) into the backend VM
#   2. `docker exec` into the workspace container
#   3. `cd $APP_DIR/backend && ./deploy/deploy.sh`
#      (git pull → install → prisma generate → prisma db push → pm2 reload → smoke tests)
#
# The schema sync IS part of the remote script now — this project uses
# `prisma db push`, and it runs without `--accept-data-loss`, so an additive
# change applies and a destructive one aborts the deploy. Skip it with
# SKIP_DB=1 if you want to apply the change by hand.
#
# Local prerequisite: gcloud CLI authenticated (`gcloud auth login`).
# =============================================================================
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
CONFIG="$HERE/.deploy-config"

if [ ! -f "$CONFIG" ]; then
  echo "✗ Missing $CONFIG — copy from .deploy-config.example"
  exit 1
fi
# shellcheck disable=SC1090
source "$CONFIG"

: "${APP_DIR:?APP_DIR not set in .deploy-config}"

# Forward env-var overrides into the remote shell so the same flags work
# from your laptop and on the box.
ENV_FORWARD=""
[ -n "${BRANCH:-}" ]       && ENV_FORWARD+="BRANCH='${BRANCH}' "
[ "${SKIP_INSTALL:-0}" = "1" ] && ENV_FORWARD+="SKIP_INSTALL=1 "
[ "${SKIP_DB:-0}" = "1" ]      && ENV_FORWARD+="SKIP_DB=1 "

REMOTE="cd $APP_DIR/backend && $ENV_FORWARD ./deploy/deploy.sh"

echo "→ deploying via gcloud IAP → $INSTANCE → $CONTAINER"
echo "  command: $REMOTE"
exec "$HERE/gcloud-connect.sh" "$REMOTE"
