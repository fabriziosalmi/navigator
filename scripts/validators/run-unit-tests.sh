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
# In CI mode with enhanced stability:
# - --run: ensure tests run once and exit
# - --coverage: collect coverage data
# - --reporter=verbose: detailed output for debugging
# - --pool=forks: use forked processes to prevent hanging
# - --poolOptions.forks.singleFork: single worker to avoid resource conflicts
if [ "${CI}" = "true" ]; then
  echo "🔧 Running in CI mode with stability optimizations..."
  pnpm test:ci
else
  echo "🔧 Running in local mode..."
  pnpm -r test
fi

echo ""
echo "✅ Unit tests completed"
