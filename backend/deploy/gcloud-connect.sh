#!/usr/bin/env bash
# =============================================================================
# One-liner: open a shell inside the workspace container on the GCP VM,
# via gcloud + IAP tunnel.
#
# Usage:
#   ./deploy/gcloud-connect.sh                # interactive shell inside container
#   ./deploy/gcloud-connect.sh "<command>"    # run command, exit
#
# Examples:
#   ./deploy/gcloud-connect.sh "cd /var/www/events-ai/backend && ./deploy/deploy.sh"
#   ./deploy/gcloud-connect.sh "pm2 status"
#   ./deploy/gcloud-connect.sh "pm2 logs events-ai --lines 80 --nostream"
#
# Requires:
#   - gcloud CLI installed locally
#   - Already authed: `gcloud auth login`
#   - IAM role on the VM: roles/iap.tunnelResourceAccessor + roles/compute.instanceAdmin.v1
#   - `.deploy-config` populated (copy from .deploy-config.example)
# =============================================================================
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
CONFIG="$HERE/.deploy-config"

if [ ! -f "$CONFIG" ]; then
  echo "✗ Missing $CONFIG"
  echo "  Copy $HERE/.deploy-config.example to $CONFIG and fill it in."
  exit 1
fi
# shellcheck disable=SC1090
source "$CONFIG"

: "${PROJECT:?PROJECT not set in .deploy-config}"
: "${INSTANCE:?INSTANCE not set in .deploy-config}"
: "${ZONE:?ZONE not set in .deploy-config}"
: "${CONTAINER:?CONTAINER not set in .deploy-config}"

REMOTE_CMD="${1:-}"

# Build the inner command that runs ON THE VM. Either drops you into a
# root bash inside the container, or runs the command non-interactively.
if [ -z "$REMOTE_CMD" ]; then
  INNER='sudo docker exec -it --user root '"$CONTAINER"' bash'
  echo "→ gcloud ssh → $INSTANCE → docker exec ($CONTAINER)…"
  gcloud compute ssh "$INSTANCE" \
    --project="$PROJECT" \
    --zone="$ZONE" \
    --tunnel-through-iap \
    -- -t "$INNER"
else
  # Escape single quotes in the user-supplied command so bash -c gets it intact.
  ESCAPED=$(printf '%s' "$REMOTE_CMD" | sed "s/'/'\\\\''/g")
  INNER="sudo docker exec --user root $CONTAINER bash -lc '$ESCAPED'"
  echo "→ remote: $REMOTE_CMD"
  gcloud compute ssh "$INSTANCE" \
    --project="$PROJECT" \
    --zone="$ZONE" \
    --tunnel-through-iap \
    --command="$INNER"
fi
