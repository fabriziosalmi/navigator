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

# IN-WORKSPACE STRATEGY: Create test app inside the monorepo workspace
# This allows native workspace:* dependency resolution without hacks
TEMP_APP_DIR="temp-e2e-app"  # Relative path - part of workspace
SERVER_PORT=${SERVER_PORT:-5173} # Default server port for preview
SERVER_URL="http://localhost:${SERVER_PORT}"
SERVER_PID=""
PLAYWRIGHT_CONFIG="tests/e2e/playwright.config.ts"
SERVER_LOG="temp-e2e-app-server.log"
TIMEOUT=120  # Increased from 60s to 120s for CI compatibility
POLL_INTERVAL=2  # Check every 2 seconds instead of 5

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
  
  # Remove temp directory (in-workspace)
  if [ -d "$TEMP_APP_DIR" ]; then
    echo "   Removing temporary app directory: $TEMP_APP_DIR"
    rm -rf "$TEMP_APP_DIR"
  fi
  
  # Remove server log
  if [ -f "$SERVER_LOG" ]; then
    echo "   Removing server log: $SERVER_LOG"
    rm -f "$SERVER_LOG"
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
# BUILD NAVIGATOR PACKAGES
# ==========================================

echo ""
echo -e "${BLUE}🔨 STEP 1.5: BUILDING NAVIGATOR PACKAGES${NC}"
echo ""
echo "   Building Navigator SDK packages for E2E test..."

# Build only the packages needed for E2E tests
if ! pnpm build --filter '@navigator.menu/core' --filter '@navigator.menu/react' --filter '@navigator.menu/plugin-keyboard' 2>&1 | grep -v "Scope:"; then
  echo -e "${RED}❌ Failed to build Navigator packages${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Packages built successfully${NC}"

# ==========================================
# CREATE FRESH TEST APPLICATION
# ==========================================

echo ""
echo -e "${BLUE}🚀 STEP 2: CREATING FRESH TEST APP (IN-WORKSPACE)${NC}"
echo ""

# Copy template directly (CLI not published yet)
TEMPLATE_DIR="packages/create-navigator-app/templates/react-ts-e2e"
WORKSPACE_ROOT="$(pwd)"

if [ ! -d "$TEMPLATE_DIR" ]; then
  echo -e "${RED}❌ Template not found at: $TEMPLATE_DIR${NC}"
  exit 1
fi

# Copy template to temp directory IN the workspace
echo "   Copying template to workspace: ${TEMP_APP_DIR}/"
if ! rsync -a --exclude 'node_modules' --exclude 'dist' --exclude 'test-results' "$TEMPLATE_DIR/" "$TEMP_APP_DIR/"; then
  echo -e "${RED}❌ Failed to copy template${NC}"
  exit 1
fi

# Update package.json for in-workspace usage
# 1. Change name to avoid conflicts
# 2. Convert file:../../packages/* to workspace:* for pnpm workspace resolution
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' 's/"name": ".*"/"name": "temp-e2e-app"/' "${TEMP_APP_DIR}/package.json"
  sed -i '' 's|"file:../../packages/core"|"workspace:*"|g' "${TEMP_APP_DIR}/package.json"
  sed -i '' 's|"file:../../packages/react"|"workspace:*"|g' "${TEMP_APP_DIR}/package.json"
  sed -i '' 's|"file:../../packages/plugin-keyboard"|"workspace:*"|g' "${TEMP_APP_DIR}/package.json"
else
  # Linux
  sed -i 's/"name": ".*"/"name": "temp-e2e-app"/' "${TEMP_APP_DIR}/package.json"
  sed -i 's|"file:../../packages/core"|"workspace:*"|g' "${TEMP_APP_DIR}/package.json"
  sed -i 's|"file:../../packages/react"|"workspace:*"|g' "${TEMP_APP_DIR}/package.json"
  sed -i 's|"file:../../packages/plugin-keyboard"|"workspace:*"|g' "${TEMP_APP_DIR}/package.json"
fi

echo -e "${GREEN}✓ Test app created in workspace${NC}"

# ==========================================
# INSTALL DEPENDENCIES
# ==========================================

echo ""
echo -e "${BLUE}� STEP 3: INSTALLING DEPENDENCIES (WORKSPACE-LEVEL)${NC}"
echo ""
echo "   Running pnpm install from workspace root..."
echo "   This will automatically link workspace:* packages to temp-e2e-app"
echo ""

# Install from workspace root - pnpm will see temp-e2e-app and resolve workspace:* deps
if ! pnpm install; then
  echo -e "${RED}❌ Failed to install dependencies${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✓ Dependencies installed and workspace packages linked${NC}"

# ==========================================
# VERIFY INSTALLATION
# ==========================================

echo ""
echo -e "${BLUE}🔍 STEP 4: VERIFYING INSTALLATION${NC}"
echo ""

# Check that temp app has a valid package.json and node_modules exists
echo "   Verifying temp app setup..."

if [ ! -f "${TEMP_APP_DIR}/package.json" ]; then
  echo -e "${RED}❌ package.json not found in temp app${NC}"
  exit 1
fi

# In workspace mode, dependencies are managed by pnpm - just verify the temp app is recognized
if ! grep -q "temp-e2e-app" "pnpm-lock.yaml" 2>/dev/null; then
  echo -e "${YELLOW}⚠️  temp-e2e-app not found in lock file (may be first run)${NC}"
fi

echo -e "${GREEN}   ✓ Temp app configured correctly${NC}"
echo -e "${GREEN}   ✓ Workspace packages will be linked at runtime${NC}"

# ==========================================
# START TEST SERVER
# ==========================================

echo ""
echo -e "${BLUE}🌐 STEP 5: STARTING TEST SERVER${NC}"
echo ""
echo "   Starting Vite dev server on $SERVER_URL..."
echo "   [$(date +%H:%M:%S)] Initializing server..."

# Check if port is already in use
if lsof -i :5173 > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Port 5173 already in use!${NC}"
  echo "   Attempting to kill existing process..."
  kill $(lsof -t -i :5173) 2>/dev/null || true
  sleep 2
fi

# Ensure port is free and start server at explicit port
echo "   [$(date +%H:%M:%S)] Verifying port ${SERVER_PORT} is free..."
if lsof -i :${SERVER_PORT} > /dev/null 2>&1; then
  echo "   ⚠️ Port ${SERVER_PORT} is in use. Attempting to kill existing process..."
  kill $(lsof -t -i:${SERVER_PORT}) 2>/dev/null || true
  sleep 1
fi

echo "   [$(date +%H:%M:%S)] Starting Vite dev server on port ${SERVER_PORT}..."
# Use dev server instead of preview - faster and more reliable for E2E tests
(cd "$TEMP_APP_DIR" && pnpm dev --port "${SERVER_PORT}" --host) > "$SERVER_LOG" 2>&1 &
SERVER_PID=$!
SERVER_URL="http://localhost:${SERVER_PORT}"

echo -e "${GREEN}   ✓ Server started (PID: $SERVER_PID)${NC}"
echo "   Server logs: $SERVER_LOG"

# Tail server logs in background for debugging
tail -f "$SERVER_LOG" &
TAIL_PID=$!

# Wait for server to be ready with improved polling
echo "   [$(date +%H:%M:%S)] Waiting for server to be ready (timeout: ${TIMEOUT}s)..."

ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
  # Check if server process is still alive
  if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${RED}❌ Server process died unexpectedly!${NC}"
    echo "   Check server logs at: $SERVER_LOG"
    echo ""
    echo "Last 20 lines of server log:"
    tail -20 "$SERVER_LOG"
    kill $TAIL_PID 2>/dev/null || true
    exit 1
  fi
  
  # Check if server responds with valid HTML
  if curl -s "$SERVER_URL" 2>/dev/null | grep -q "<title>" ; then
    echo "   [$(date +%H:%M:%S)] Server is responding!"
    break
  fi
  
  sleep $POLL_INTERVAL
  ELAPSED=$((ELAPSED + POLL_INTERVAL))
  
  # Progress indicator every 10 seconds
  if [ $((ELAPSED % 10)) -eq 0 ]; then
    echo "   [$(date +%H:%M:%S)] Still waiting... (${ELAPSED}s / ${TIMEOUT}s)"
  fi
done

# Stop tailing logs
kill $TAIL_PID 2>/dev/null || true

if [ $ELAPSED -ge $TIMEOUT ]; then
  echo -e "${RED}❌ Server failed to start within $TIMEOUT seconds${NC}"
  echo "   Check server logs at: $SERVER_LOG"
  echo ""
  echo "Last 30 lines of server log:"
  tail -30 "$SERVER_LOG"
  exit 1
fi

echo -e "${GREEN}   ✓ Server is ready at $SERVER_URL (startup time: ${ELAPSED}s)${NC}"

# ==========================================
# RUN PLAYWRIGHT TESTS
# ==========================================

echo ""
echo -e "${BLUE}🎬 STEP 6: RUNNING E2E TESTS${NC}"
echo ""

# Set BASE_URL environment variable for Playwright
export BASE_URL="$SERVER_URL"

# Run Playwright tests using centralized config
if pnpm playwright test --config="$WORKSPACE_ROOT/$PLAYWRIGHT_CONFIG"; then
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
echo "   Test App: $TEMP_APP_DIR (cleaned up)"
echo "   Server: $SERVER_URL"
echo "   Server startup time: ${ELAPSED}s"
echo "   Config: $PLAYWRIGHT_CONFIG"
echo "   Result: $([ $EXIT_CODE -eq 0 ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"
echo ""
echo "📊 E2E Metrics:"
echo "   Server startup: ${ELAPSED}s"
echo "   Timeout limit: ${TIMEOUT}s"
echo ""

# Cleanup will run automatically via trap
exit $EXIT_CODE
