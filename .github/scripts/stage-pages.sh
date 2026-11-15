#!/usr/bin/env bash
set -euo pipefail

# Build a minimal static Pages payload. Keep agent/state.json because the
# browser console reads it, but do not publish the historical JSON run archive.
rm -rf _site
mkdir -p _site
rsync -a \
  --exclude='.git/' \
  --exclude='.github/' \
  --exclude='agent/runs/' \
  --exclude='_site/' \
  ./ _site/

test -s _site/index.html
test -s _site/agent/state.json
test ! -e _site/agent/runs

# Historical run archives are not part of the browser UI contract.
if grep -nE 'agent/runs/' agent-runtime.js agent.html agent/index.html index.html buyer-radar.html 2>/dev/null; then
  echo "Unexpected browser reference to agent/runs; review before excluding it."
  exit 1
fi

echo "Pages staging verified: retained agent/state.json and excluded agent/runs/."
