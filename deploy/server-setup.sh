#!/usr/bin/env bash
# One-time Ubuntu setup on the server that currently hosts Caddy.
# Usage: sudo bash server-setup.sh [deploy-user]
set -euo pipefail

[[ "$(id -u)" -eq 0 ]] || { echo 'Run with sudo' >&2; exit 1; }
deploy_user="${1:-ubuntu}"
id "$deploy_user" >/dev/null || { echo "Unknown user: $deploy_user" >&2; exit 1; }
command -v caddy >/dev/null || { echo 'Caddy is required' >&2; exit 1; }
command -v curl >/dev/null || { echo 'curl is required' >&2; exit 1; }

# Install an isolated Node 24 runtime. Do not change the Node version of other sites.
node_prefix=/opt/dh-game/node
if [[ ! -x "$node_prefix/bin/node" ]] || [[ "$("$node_prefix/bin/node" --version)" != v24.* ]]; then
  case "$(uname -m)" in
    aarch64) node_arch=arm64 ;;
    x86_64) node_arch=x64 ;;
    *) echo 'Unsupported CPU architecture' >&2; exit 1 ;;
  esac
  temp_dir="$(mktemp -d)"
  trap 'rm -rf "$temp_dir"' EXIT
  curl -fsSL https://nodejs.org/dist/latest-v24.x/SHASUMS256.txt -o "$temp_dir/SHASUMS256.txt"
  tarball="$(awk -v arch="$node_arch" '$2 ~ "^node-v24[.].*-linux-" arch "[.]tar[.]xz$" { print $2; exit }' "$temp_dir/SHASUMS256.txt")"
  [[ -n "$tarball" ]] || { echo 'Node 24 archive not found' >&2; exit 1; }
  curl -fsSL "https://nodejs.org/dist/latest-v24.x/$tarball" -o "$temp_dir/$tarball"
  (cd "$temp_dir" && grep -F "  $tarball" SHASUMS256.txt | sha256sum -c -)
  mkdir -p /opt/dh-game
  mkdir "$temp_dir/node"
  tar -xJf "$temp_dir/$tarball" -C "$temp_dir/node" --strip-components=1
  if [[ -e "$node_prefix" ]]; then
    mv "$node_prefix" "$node_prefix.backup.$(date +%Y%m%d-%H%M%S)"
  fi
  mv "$temp_dir/node" "$node_prefix"
fi

install -d -m 755 /srv/dh-game /srv/dh-game/releases
install -d -m 750 /var/lib/dh-game
chown "$deploy_user:$deploy_user" /srv/dh-game /srv/dh-game/releases /var/lib/dh-game

service_file=/etc/systemd/system/dh-game.service
if [[ -e "$service_file" ]]; then
  cp -a "$service_file" "$service_file.backup.$(date +%Y%m%d-%H%M%S)"
fi
cat > "$service_file" <<SERVICE
[Unit]
Description=Nyanyang Restaurant game
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$deploy_user
Group=$deploy_user
WorkingDirectory=/srv/dh-game/current
Environment=NODE_ENV=production
Environment=PORT=4173
Environment=NYANG_DB_PATH=/var/lib/dh-game/nyanyang.sqlite
Environment=PATH=/opt/dh-game/node/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ExecStart=/opt/dh-game/node/bin/npm run start
Restart=always
RestartSec=3
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
SERVICE
systemctl daemon-reload
systemctl enable dh-game

caddyfile=/etc/caddy/Caddyfile
site_dir=/etc/caddy/sites
site_file="$site_dir/dh-game.caddy"
[[ -f "$caddyfile" ]] || { echo 'Caddyfile not found' >&2; exit 1; }
mkdir -p "$site_dir"
backup_stamp="$(date +%Y%m%d-%H%M%S)"
cp -a "$caddyfile" "$caddyfile.backup.$backup_stamp"
had_site=false
if [[ -e "$site_file" ]]; then
  had_site=true
  cp -a "$site_file" "$site_file.backup.$backup_stamp"
fi
cat > "$site_file" <<'CADDY'
leedada.duckdns.org {
    encode zstd gzip
    reverse_proxy 127.0.0.1:4173
    header X-Content-Type-Options nosniff
}
CADDY
chmod 644 "$site_file"
if ! grep -qF 'import /etc/caddy/sites/*.caddy' "$caddyfile"; then
  printf '\nimport /etc/caddy/sites/*.caddy\n' >> "$caddyfile"
fi
if ! caddy validate --config "$caddyfile" --adapter caddyfile; then
  cp -a "$caddyfile.backup.$backup_stamp" "$caddyfile"
  if [[ "$had_site" == true ]]; then
    cp -a "$site_file.backup.$backup_stamp" "$site_file"
  else
    rm -f "$site_file"
  fi
  echo 'Invalid Caddy configuration; restored previous files' >&2
  exit 1
fi
if ! systemctl reload caddy; then
  cp -a "$caddyfile.backup.$backup_stamp" "$caddyfile"
  if [[ "$had_site" == true ]]; then
    cp -a "$site_file.backup.$backup_stamp" "$site_file"
  else
    rm -f "$site_file"
  fi
  systemctl reload caddy || true
  echo 'Caddy reload failed; restored previous files' >&2
  exit 1
fi

echo 'Server ready. Register the game deploy SSH public key, set repository secrets, then push main.'
