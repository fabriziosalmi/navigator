#!/bin/bash
#
# Lint Validator
# Runs ESLint on all packages and apps
#

set -e

echo "🔎 Linting all packages and applications..."
echo ""

# Check if lint script exists in root package.json
if ! grep -q '"lint"' package.json; then
  echo "⚠️  No lint script found in root package.json"
  echo "ℹ️  Skipping lint check"
  exit 0
fi

# Run lint across all workspaces
pnpm lint --filter="..."

echo ""
echo "✅ Linting completed"
