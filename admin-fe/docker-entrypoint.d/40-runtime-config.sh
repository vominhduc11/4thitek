#!/bin/sh
set -eu

API_ORIGIN_VALUE="${API_ORIGIN:-${VITE_API_ORIGIN:-}}"
API_VERSION_VALUE="${API_VERSION:-${VITE_API_VERSION:-}}"
API_BASE_URL_VALUE="${API_BASE_URL:-${VITE_API_BASE_URL:-}}"

if [ -z "$API_BASE_URL_VALUE" ]; then
  if [ -n "$API_ORIGIN_VALUE" ]; then
    API_ORIGIN_VALUE="${API_ORIGIN_VALUE%/}"
    API_VERSION_NORMALIZED="${API_VERSION_VALUE#/}"
    API_VERSION_NORMALIZED="${API_VERSION_NORMALIZED%/}"
    if [ -z "$API_VERSION_NORMALIZED" ]; then
      API_VERSION_NORMALIZED="v1"
    elif printf '%s' "$API_VERSION_NORMALIZED" | grep -Eq '^[0-9]+$'; then
      API_VERSION_NORMALIZED="v${API_VERSION_NORMALIZED}"
    elif ! printf '%s' "$API_VERSION_NORMALIZED" | grep -Eq '^v'; then
      API_VERSION_NORMALIZED="v${API_VERSION_NORMALIZED}"
    fi
    API_BASE_URL_VALUE="${API_ORIGIN_VALUE}/api/${API_VERSION_NORMALIZED}"
  else
    API_BASE_URL_VALUE="http://localhost:8080/api/v1"
  fi
fi

cat <<EOF >/usr/share/nginx/html/runtime-config.js
window.__APP_CONFIG__ = {
  apiOrigin: '${API_ORIGIN_VALUE}',
  apiVersion: '${API_VERSION_VALUE}',
  apiBaseUrl: '${API_BASE_URL_VALUE}'
}
EOF
