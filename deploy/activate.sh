#!/usr/bin/env bash
# Run as the SSH deploy user after uploading a unique release directory.
set -euo pipefail

release_id="${1:?release ID required}"
[[ "$release_id" =~ ^[0-9a-f]{40}-[0-9]+-[0-9]+$ ]] || { echo 'Invalid release ID' >&2; exit 1; }
base=/srv/dh-game
release="$base/releases/$release_id"
[[ -d "$release" && -f "$release/package-lock.json" && -f "$release/dist/index.html" ]] || {
  echo 'Incomplete release' >&2
  exit 1
}

export PATH="/opt/dh-game/node/bin:$PATH"
cd "$release"
npm ci --omit=dev --no-audit --no-fund

previous=''
if [[ -L "$base/current" ]]; then
  previous="$(readlink -f "$base/current")"
fi
ln -s "$release" "$base/current.next"
mv -Tf "$base/current.next" "$base/current"

healthy=false
if sudo -n systemctl restart dh-game; then
  for attempt in $(seq 1 12); do
    if curl --fail --silent --max-time 2 http://127.0.0.1:4173/api/health | grep -q '"ok":true'; then
      healthy=true
      break
    fi
    sleep 2
  done
fi

if [[ "$healthy" != true ]]; then
  echo 'New release failed its health check; restoring previous release' >&2
  if [[ -n "$previous" && -d "$previous" ]]; then
    ln -s "$previous" "$base/current.rollback"
    mv -Tf "$base/current.rollback" "$base/current"
    sudo -n systemctl restart dh-game
  else
    rm -f "$base/current"
    sudo -n systemctl stop dh-game
  fi
  exit 1
fi

echo "Activated $release_id"
