#!/bin/bash

# Navigator Documentation Sync Script
# Syncs documentation from docs/docs to apps/docs

set -e

echo "🔄 Syncing documentation from docs/docs to apps/docs..."

# Base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCS_SRC="$BASE_DIR/docs/docs"
DOCS_DEST="$BASE_DIR/apps/docs"

# Check if source directory exists
if [ ! -d "$DOCS_SRC" ]; then
    echo "❌ Error: Source directory $DOCS_SRC not found"
    exit 1
fi

# Check if destination directory exists
if [ ! -d "$DOCS_DEST" ]; then
    echo "❌ Error: Destination directory $DOCS_DEST not found"
    exit 1
fi

# Sync individual files (convert to kebab-case)
echo "📄 Syncing individual files..."
cp "$DOCS_SRC/GETTING_STARTED.md" "$DOCS_DEST/getting-started.md"
cp "$DOCS_SRC/ARCHITECTURE.md" "$DOCS_DEST/architecture.md"
cp "$DOCS_SRC/FEATURES.md" "$DOCS_DEST/features.md"
cp "$DOCS_SRC/COOKBOOK.md" "$DOCS_DEST/cookbook.md"
cp "$DOCS_SRC/CONFIGURATION.md" "$DOCS_DEST/configuration.md"
cp "$DOCS_SRC/PLUGIN_ARCHITECTURE.md" "$DOCS_DEST/plugin-architecture.md"
cp "$DOCS_SRC/COGNITIVE_INTELLIGENCE_SYSTEM.md" "$DOCS_DEST/cognitive-intelligence.md"
cp "$DOCS_SRC/OPTIMIZATION_GUIDE.md" "$DOCS_DEST/optimization-guide.md"
cp "$DOCS_SRC/DUAL_HUD_LAYOUT.md" "$DOCS_DEST/dual-hud-layout.md"
cp "$DOCS_SRC/MONOCHROME_DESIGN.md" "$DOCS_DEST/monochrome-design.md"
cp "$DOCS_SRC/CSS_MODULARIZATION.md" "$DOCS_DEST/css-modularization.md"
cp "$DOCS_SRC/BRANCH_PROTECTION_GUIDE.md" "$DOCS_DEST/branch-protection.md"

# Sync directories
echo "📁 Syncing directories..."
mkdir -p "$DOCS_DEST/testing"
mkdir -p "$DOCS_DEST/security"

if [ -d "$DOCS_SRC/testing" ]; then
    cp -r "$DOCS_SRC/testing/"* "$DOCS_DEST/testing/" 2>/dev/null || true
fi

if [ -d "$DOCS_SRC/security" ]; then
    cp -r "$DOCS_SRC/security/"* "$DOCS_DEST/security/" 2>/dev/null || true
fi

echo "✅ Documentation synced successfully!"
echo ""
echo "Next steps:"
echo "  1. Review changes: cd apps/docs && git diff"
echo "  2. Test locally: cd apps/docs && pnpm dev"
echo "  3. Commit and push to deploy to Vercel"
