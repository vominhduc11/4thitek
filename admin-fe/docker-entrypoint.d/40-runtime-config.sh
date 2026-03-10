#!/bin/sh
set -eu

API_BASE_URL_VALUE="${API_BASE_URL:-${VITE_API_BASE_URL:-/api/v1}}"

cat <<EOF >/usr/share/nginx/html/runtime-config.js
window.__APP_CONFIG__ = {
  apiBaseUrl: '${API_BASE_URL_VALUE}'
}
EOF
