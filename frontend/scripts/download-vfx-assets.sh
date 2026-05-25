#!/usr/bin/env bash
set -euo pipefail

ASSET_URL="https://kenney.nl/media/pages/assets/smoke-particles/23249a0d35-1677695171/kenney_smoke-particles.zip"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/public/textures/vfx"
TMP_DIR="$(mktemp -d)"
ZIP_PATH="/tmp/kenney_smoke-particles.zip"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

mkdir -p "$OUT_DIR"
curl -L "$ASSET_URL" -o "$ZIP_PATH"
unzip -q "$ZIP_PATH" -d "$TMP_DIR"

SMOKE_PNG="$(
  find "$TMP_DIR" -iname "*.png" | awk '
    BEGIN { best = ""; nonblack = ""; fallback = "" }
    {
      if (fallback == "") fallback = $0
      lower = tolower($0)
      if (nonblack == "" && lower !~ /black/ && (lower ~ /smoke/ || lower ~ /puff/ || lower ~ /cloud/)) nonblack = $0
      if (best == "" && (lower ~ /smoke/ || lower ~ /puff/ || lower ~ /cloud/)) best = $0
    }
    END { print nonblack != "" ? nonblack : (best != "" ? best : fallback) }
  '
)"

if [ -z "$SMOKE_PNG" ]; then
  echo "No PNG found in Kenney Smoke Particles archive." >&2
  exit 1
fi

LICENSE_FILE="$(
  find "$TMP_DIR" -iname "license*" -o -iname "License*" | head -n 1
)"

cp "$SMOKE_PNG" "$OUT_DIR/smoke.png"
if [ -n "$LICENSE_FILE" ]; then
  cp "$LICENSE_FILE" "$OUT_DIR/LICENSE-Kenney-Smoke-Particles.txt"
else
  cat > "$OUT_DIR/LICENSE-Kenney-Smoke-Particles.txt" <<'LICENSE'
Kenney Smoke Particles
Source: https://kenney.nl/assets/smoke-particles
License: CC0 1.0 Universal
LICENSE
fi

echo "Copied $(basename "$SMOKE_PNG") to $OUT_DIR/smoke.png"
