#!/usr/bin/env bash

# ==========================================
# Navigator Ecosystem Validator
# Step 5: Autonomous End-to-End Tests
# ==========================================
#
# This script creates a FRESH test application from scratch,
# installs dependencies using local workspace packages,
# starts the server, runs Playwright tests, and cleans up.
#
# This ensures E2E tests represent the actual user experience.
# ==========================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==========================================
# CONFIGURATION
# ==========================================

TEMP_APP_DIR="/tmp/navigator-e2e-temp-app"  # Outside workspace to avoid pnpm workspace issues
SERVER_URL="http://localhost:5173"
SERVER_PID=""
PLAYWRIGHT_CONFIG="tests/e2e/playwright.config.ts"

# ==========================================
# CLEANUP FUNCTION (ALWAYS RUNS)
# ==========================================

cleanup() {
  echo ""
  echo -e "${BLUE}🧹 CLEANING UP...${NC}"
  
  # Kill server if running
  if [ ! -z "$SERVER_PID" ]; then
    echo "   Stopping test server (PID: $SERVER_PID)..."
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
  fi
  
  # Remove temp directory
  if [ -d "$TEMP_APP_DIR" ]; then
    echo "   Removing temporary app directory: $TEMP_APP_DIR"
    rm -rf "$TEMP_APP_DIR"
  fi
  
  echo -e "${GREEN}   ✓ Cleanup complete${NC}"
}

# Set trap to run cleanup on EXIT (success or failure)
trap cleanup EXIT

# ==========================================
# SETUP
# ==========================================

echo ""
echo "=================================================="
echo "🎭 AUTONOMOUS END-TO-END TEST SUITE"
echo "=================================================="
echo ""

echo -e "${BLUE}🛠️  STEP 1: SETUP${NC}"
echo ""

# Clean up from previous failed runs
if [ -d "$TEMP_APP_DIR" ]; then
  echo -e "${YELLOW}⚠️  Found existing temp directory from previous run${NC}"
  echo "   Removing: $TEMP_APP_DIR"
  rm -rf "$TEMP_APP_DIR"
fi

echo -e "${GREEN}✓ Setup complete${NC}"

# ==========================================
# CREATE FRESH TEST APPLICATION
# ==========================================

echo ""
echo -e "${BLUE}🚀 STEP 2: CREATING FRESH TEST APP${NC}"
echo ""
echo "   Copying react-ts-e2e template..."
echo ""

# Copy template directly (CLI not published yet)
TEMPLATE_DIR="packages/create-navigator-app/templates/react-ts-e2e"
WORKSPACE_ROOT="$(pwd)"

if [ ! -d "$TEMPLATE_DIR" ]; then
  echo -e "${RED}❌ Template not found at: $TEMPLATE_DIR${NC}"
  exit 1
fi

if ! cp -r "$TEMPLATE_DIR" "$TEMP_APP_DIR"; then
  echo -e "${RED}❌ Failed to copy template${NC}"
  exit 1
fi

# Fix package.json paths to use absolute paths
cd "$TEMP_APP_DIR"
sed -i '' "s|file:../../packages/core|file:$WORKSPACE_ROOT/packages/core|g" package.json
sed -i '' "s|file:../../packages/react|file:$WORKSPACE_ROOT/packages/react|g" package.json
sed -i '' "s|file:../../packages/plugin-keyboard|file:$WORKSPACE_ROOT/packages/plugin-keyboard|g" package.json
cd "$WORKSPACE_ROOT"

echo ""
echo -e "${GREEN}✓ Test app created successfully${NC}"

# ==========================================
# INSTALL DEPENDENCIES
# ==========================================

echo ""
echo -e "${BLUE}📦 STEP 3: INSTALLING DEPENDENCIES${NC}"
echo ""
echo "   Installing dependencies with local package links..."
echo ""

# Install dependencies in the temp app directory
# file: protocol will link to local packages
if ! pnpm install --dir="$TEMP_APP_DIR" --no-frozen-lockfile; then
  echo -e "${RED}❌ Failed to install dependencies${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✓ Dependencies installed (using local workspace packages)${NC}"

# ==========================================
# VERIFY INSTALLATION
# ==========================================

echo ""
echo -e "${BLUE}🔍 STEP 4: VERIFYING INSTALLATION${NC}"
echo ""

# Check that Navigator packages are linked
echo "   Checking Navigator package links..."

if [ ! -d "$TEMP_APP_DIR/node_modules/@navigator.menu/core" ]; then
  echo -e "${RED}❌ @navigator.menu/core not found${NC}"
  exit 1
fi

if [ ! -d "$TEMP_APP_DIR/node_modules/@navigator.menu/react" ]; then
  echo -e "${RED}❌ @navigator.menu/react not found${NC}"
  exit 1
fi

echo -e "${GREEN}   ✓ @navigator.menu/core linked${NC}"
echo -e "${GREEN}   ✓ @navigator.menu/react linked${NC}"
echo -e "${GREEN}   ✓ All packages linked correctly${NC}"

# ==========================================
# START TEST SERVER
# ==========================================

echo ""
echo -e "${BLUE}🌐 STEP 5: STARTING TEST SERVER${NC}"
echo ""
echo "   Starting Vite dev server on $SERVER_URL..."

# Start server in background (use npx vite directly)
WORKSPACE_ROOT_ABS="$(pwd)"
(cd "$TEMP_APP_DIR" && npx vite) > /dev/null 2>&1 &
SERVER_PID=$!

echo -e "${GREEN}   ✓ Server started (PID: $SERVER_PID)${NC}"

# Wait for server to be ready (simple curl polling)
echo "   Waiting for server to be ready..."

TIMEOUT=60
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
  if curl -s "$SERVER_URL" > /dev/null 2>&1; then
    break
  fi
  sleep 2
  ELAPSED=$((ELAPSED + 2))
done || true  # Don't exit on curl failure during polling

if [ $ELAPSED -ge $TIMEOUT ]; then
  echo -e "${RED}❌ Server failed to start within $TIMEOUT seconds${NC}"
  exit 1
fi

echo -e "${GREEN}   ✓ Server is ready at $SERVER_URL${NC}"

# ==========================================
# RUN PLAYWRIGHT TESTS
# ==========================================

echo ""
echo -e "${BLUE}🎬 STEP 6: RUNNING E2E TESTS${NC}"
echo ""

# Set BASE_URL environment variable for Playwright
export BASE_URL="$SERVER_URL"

# Run Playwright tests using centralized config
if pnpm playwright test --config="$PLAYWRIGHT_CONFIG"; then
  echo ""
  echo -e "${GREEN}✅ ALL E2E TESTS PASSED!${NC}"
  EXIT_CODE=0
else
  echo ""
  echo -e "${RED}❌ E2E TESTS FAILED${NC}"
  echo ""
  echo -e "${YELLOW}📊 Playwright HTML report available at:${NC}"
  echo "   playwright-report/index.html"
  EXIT_CODE=1
fi

# ==========================================
# SUMMARY
# ==========================================

echo ""
echo "=================================================="
echo "📊 E2E TEST SUMMARY"
echo "=================================================="
echo ""
echo "   Test App: $TEMP_APP_DIR (will be removed)"
echo "   Server: $SERVER_URL"
echo "   Config: $PLAYWRIGHT_CONFIG"
echo "   Result: $([ $EXIT_CODE -eq 0 ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"
echo ""

# Cleanup will run automatically via trap
exit $EXIT_CODE
