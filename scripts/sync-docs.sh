#!/bin/bash

# Navigator Documentation Sync Script
# Syncs documentation from project-docs to apps/docs-site (public documentation)

set -e

echo "🔄 Syncing public documentation..."

# Base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCS_DEST="$BASE_DIR/apps/docs-site"

# Check if destination directory exists
if [ ! -d "$DOCS_DEST" ]; then
    echo "❌ Error: Destination directory $DOCS_DEST not found"
    exit 1
fi

echo "✅ Documentation site structure is ready at $DOCS_DEST"
echo ""
echo "Note: This script is for future automation."
echo "Public docs are now maintained directly in apps/docs-site/"
echo "Internal project docs are in project-docs/"
