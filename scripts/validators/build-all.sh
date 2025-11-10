#!/bin/bash
#
# Build Validator
# Builds all SDK packages and applications
#

set -e

echo "🏗️  Building all packages and applications..."
echo ""

# Check if build script exists in root package.json
if ! grep -q '"build"' package.json; then
  echo "⚠️  No build script found in root package.json"
  echo "ℹ️  Skipping build check"
  exit 0
fi

# Build SDK packages first
echo "📦 Building SDK packages..."
pnpm -r --filter './packages/**' build

echo ""

# Build applications
echo "🚀 Building applications..."
pnpm -r --filter './apps/*' build

echo ""
echo "✅ Build completed"
