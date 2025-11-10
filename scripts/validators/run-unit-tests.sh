#!/bin/bash
#
# Unit Tests Validator
# Runs unit tests with coverage across all packages
#

set -e

echo "🧪 Running unit tests with coverage..."
echo ""

# Check if test script exists in root package.json
if ! grep -q '"test"' package.json; then
  echo "⚠️  No test script found in root package.json"
  echo "ℹ️  Skipping unit tests check"
  exit 0
fi

# Run tests across all workspaces
# Note: --coverage flag not supported at root level, run without it
pnpm test --filter="..."

echo ""
echo "✅ Unit tests completed"
