#!/bin/bash
set -euo pipefail
DOMAIN="${1:?hostname required}"
ARCHIVE="${2:?archive path required}"
dnf install -y nodejs22 nodejs22-npm unzip
if [ -x /usr/bin/node-22 ]; then alternatives --set node /usr/bin/node-22; fi
if ! id sector16 >/dev/null 2>&1; then useradd --system --home-dir /var/lib/sector16 --create-home --shell /sbin/nologin sector16; fi
if ! id caddy >/dev/null 2>&1; then useradd --system --home-dir /var/lib/caddy --create-home --shell /sbin/nologin caddy; fi
if [ ! -x /usr/local/bin/caddy ]; then
 curl -fsSL --retry 3 'https://caddyserver.com/api/download?os=linux&arch=amd64' -o /usr/local/bin/caddy
 chmod 755 /usr/local/bin/caddy
fi
RELEASE="/opt/sector16/releases/$(date +%Y%m%d%H%M%S)"
mkdir -p "$RELEASE" /etc/caddy
tar -xzf "$ARCHIVE" -C "$RELEASE"
cd "$RELEASE"
npm ci --omit=dev --no-audit --no-fund
chown -R sector16:sector16 /opt/sector16
ln -sfn "$RELEASE" /opt/sector16/current
cat > /etc/systemd/system/sector16.service <<'UNIT'
[Unit]
Description=Sector 16 multiplayer game server
After=network-online.target
Wants=network-online.target
[Service]
Type=simple
User=sector16
Group=sector16
WorkingDirectory=/opt/sector16/current
Environment=NODE_ENV=production
Environment=HOST=127.0.0.1
Environment=PORT=3000
ExecStart=/usr/bin/node --max-old-space-size=256 server/index.mjs
Restart=always
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
MemoryMax=384M
LimitNOFILE=8192
[Install]
WantedBy=multi-user.target
UNIT
cat > /etc/caddy/Caddyfile <<CADDY
$DOMAIN {
 encode zstd gzip
 reverse_proxy 127.0.0.1:3000
 header Strict-Transport-Security "max-age=31536000"
}
CADDY
chown -R caddy:caddy /etc/caddy /var/lib/caddy
cat > /etc/systemd/system/caddy.service <<'UNIT'
[Unit]
Description=Caddy HTTPS proxy for Sector 16
After=network-online.target
Wants=network-online.target
[Service]
Type=notify
User=caddy
Group=caddy
ExecStart=/usr/local/bin/caddy run --environ --config /etc/caddy/Caddyfile
ExecReload=/usr/local/bin/caddy reload --config /etc/caddy/Caddyfile --force
Restart=on-failure
TimeoutStopSec=5s
LimitNOFILE=1048576
AmbientCapabilities=CAP_NET_BIND_SERVICE
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
PrivateTmp=true
ProtectSystem=full
NoNewPrivileges=true
[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable sector16 caddy
systemctl restart sector16
/usr/local/bin/caddy validate --config /etc/caddy/Caddyfile
systemctl restart caddy
sleep 2
curl --fail --silent http://127.0.0.1:3000/api/health
systemctl is-active sector16 caddy
