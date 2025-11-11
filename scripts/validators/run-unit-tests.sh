#!/bin/bash
#
# Unit Tests Validator
# Runs unit tests with coverage across all packages
#

set -e

echo "🧪 Running unit tests with coverage..."
echo ""

# Build packages first to ensure dist/ artifacts exist
# Required for Vite to resolve package imports during tests
echo "📦 Building packages before tests..."
pnpm -r build
echo ""

# Check if test script exists in root package.json
if ! grep -q '"test"' package.json; then
  echo "⚠️  No test script found in root package.json"
  echo "ℹ️  Skipping unit tests check"
  exit 0
fi

# Run tests across all workspaces
# Use -r for recursive instead of --filter="..."
pnpm -r test

echo ""
echo "✅ Unit tests completed"
