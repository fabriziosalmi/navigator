#!/bin/bash
#
# Dependency Check Validator
# Checks for outdated packages and security vulnerabilities
#

set -e

echo "🔍 Checking for outdated dependencies..."
echo ""

# Check outdated (non-blocking, just informational)
pnpm outdated || true

echo ""
echo "🔒 Auditing for security vulnerabilities..."
echo ""

# Run audit (fails on high/critical vulnerabilities in production)
# Using --audit-level=high to fail only on high/critical issues
pnpm audit --audit-level=high --prod

echo ""
echo "✅ Dependency check completed"
