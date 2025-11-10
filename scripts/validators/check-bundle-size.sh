#!/bin/bash
#
# Bundle Size Validator
# Checks bundle sizes against configured limits using size-limit
#

set -e

echo "📏 Checking bundle sizes..."
echo ""

# Check if size-limit is installed
if ! command -v size-limit &> /dev/null && ! pnpm list size-limit &> /dev/null; then
  echo "⚠️  size-limit not found"
  echo "ℹ️  Install with: pnpm add -D size-limit @size-limit/preset-small-lib"
  echo "ℹ️  Configure in package.json under 'size-limit' key"
  echo "ℹ️  Skipping bundle size check"
  exit 0
fi

# Check if size-limit is configured in package.json
if ! grep -q '"size-limit"' package.json; then
  echo "⚠️  No size-limit configuration found in package.json"
  echo "ℹ️  Example configuration:"
  echo '    "size-limit": ['
  echo '      {'
  echo '        "path": "packages/core/dist/index.js",'
  echo '        "limit": "15 kB"'
  echo '      },'
  echo '      {'
  echo '        "path": "packages/react/dist/index.js",'
  echo '        "limit": "1 kB"'
  echo '      }'
  echo '    ]'
  echo "ℹ️  Skipping bundle size check"
  exit 0
fi

# Run size-limit
pnpm size-limit

echo ""
echo "✅ Bundle size check completed"
