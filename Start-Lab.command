#!/usr/bin/env sh
cd -- "$(dirname -- "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Install Node.js 22.13 or newer from https://nodejs.org/ and try again."
  exit 1
fi
exec node runtime/server.js
