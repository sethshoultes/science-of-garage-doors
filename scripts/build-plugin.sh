#!/usr/bin/env bash
#
# Build a distributable A Plus Garage Door Science plugin zip.
#
# Usage:
#   ./scripts/build-plugin.sh          # auto-detects version from plugin header
#   ./scripts/build-plugin.sh 1.2.0    # override version
#
# Output: dist/aplus-garage-door-science-<version>.zip

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DIST_DIR="$PROJECT_ROOT/dist"
SLUG="aplus-garage-door-science"

# Resolve version.
if [[ -n "${1:-}" ]]; then
  VERSION="$1"
else
  VERSION=$(sed -n 's/^.*Version:[[:space:]]*\([0-9.]*\).*/\1/p' "$PROJECT_ROOT/aplus-garage-door-science.php" | head -1)
  VERSION="${VERSION:-0.0.0}"
fi

ZIP_NAME="${SLUG}-${VERSION}.zip"

echo "Building $ZIP_NAME ..."

# Clean and prepare dist directory.
rm -rf "$DIST_DIR/$SLUG" "$DIST_DIR/$ZIP_NAME"
mkdir -p "$DIST_DIR/$SLUG"

# Copy only plugin files.
cp "$PROJECT_ROOT/aplus-garage-door-science.php" "$DIST_DIR/$SLUG/"
cp "$PROJECT_ROOT/readme.txt" "$DIST_DIR/$SLUG/"
cp -r "$PROJECT_ROOT/includes" "$DIST_DIR/$SLUG/"
cp -r "$PROJECT_ROOT/blocks" "$DIST_DIR/$SLUG/"
cp -r "$PROJECT_ROOT/viewers" "$DIST_DIR/$SLUG/"

# Create zip.
cd "$DIST_DIR"
zip -rq "$ZIP_NAME" "$SLUG/"

# Clean up expanded directory.
rm -rf "$DIST_DIR/$SLUG"

# Report.
SIZE=$(du -h "$DIST_DIR/$ZIP_NAME" | cut -f1)
FILE_COUNT=$(unzip -l "$DIST_DIR/$ZIP_NAME" | tail -1 | awk '{print $2}')
echo ""
echo "Done! dist/$ZIP_NAME ($SIZE, $FILE_COUNT files)"
echo ""
echo "Contents:"
unzip -l "$DIST_DIR/$ZIP_NAME" | grep -v "^Archive\|^  Length\|^-\|files$" | head -30
