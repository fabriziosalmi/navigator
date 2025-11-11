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
SERVER_PORT=${SERVER_PORT:-5173} # Default server port for preview
SERVER_URL="http://localhost:5173"
SERVER_PID=""
PLAYWRIGHT_CONFIG="tests/e2e/playwright.config.ts"
SERVER_LOG="/tmp/navigator-e2e-server.log"
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
  
  # Remove temp directory
  TEMP_APP_DIR="/tmp/navigator-e2e-temp-app"  # Outside workspace to avoid pnpm workspace issues
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
echo -e "${BLUE}🚀 STEP 2: CREATING FRESH TEST APP${NC}"
echo ""
echo "   Copying react-ts-e2e template..."
echo ""

# Copy template directly (CLI not published yet)
TEMPLATE_DIR="packages/create-navigator-app/templates/react-ts-e2e"
APP_TO_TEST=${APP_TO_TEST:-}
WORKSPACE_ROOT="$(pwd)"

if [ ! -d "$TEMPLATE_DIR" ]; then
  echo -e "${RED}❌ Template not found at: $TEMPLATE_DIR${NC}"
  exit 1
fi

if [[ -n "$APP_TO_TEST" ]]; then
  # If an app is provided, run that app directly (do not copy to temp dir)
  if [[ -d "$WORKSPACE_ROOT/$APP_TO_TEST" ]]; then
    echo "   Using workspace app: $APP_TO_TEST"
    TEMP_APP_DIR="$WORKSPACE_ROOT/$APP_TO_TEST"
  else
    echo -e "${RED}❌ Specified APP_TO_TEST not found: $APP_TO_TEST${NC}"
    exit 1
  fi
else
  if ! rsync -a --exclude 'node_modules' --exclude 'dist' --exclude 'test-results' "$TEMPLATE_DIR/" "$TEMP_APP_DIR/"; then
    echo -e "${RED}❌ Failed to copy template${NC}"
    exit 1
  fi
fi

# Fix package.json paths to use absolute paths
cd "$TEMP_APP_DIR"

# Detect OS for sed compatibility
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s|file:../../packages/core|file:$WORKSPACE_ROOT/packages/core|g" package.json
  sed -i '' "s|file:../../packages/react|file:$WORKSPACE_ROOT/packages/react|g" package.json
  sed -i '' "s|file:../../packages/plugin-keyboard|file:$WORKSPACE_ROOT/packages/plugin-keyboard|g" package.json
  # Ensure local types package is linked in the temp app to satisfy workspace:* deps
  sed -i '' "s|"@navigator.menu/react": \(".*"\),|\n    \"@navigator.menu/react\": \1,\n    \"@navigator.menu/types\": \"file:$WORKSPACE_ROOT/packages/types\",|g" package.json || true
else
  # Linux
  sed -i "s|file:../../packages/core|file:$WORKSPACE_ROOT/packages/core|g" package.json
  sed -i "s|file:../../packages/react|file:$WORKSPACE_ROOT/packages/react|g" package.json
  sed -i "s|file:../../packages/plugin-keyboard|file:$WORKSPACE_ROOT/packages/plugin-keyboard|g" package.json
  # Ensure local types package is linked in the temp app to satisfy workspace:* deps
  sed -i "s|\"@navigator.menu/react\": \(".*"\),|\n    \"@navigator.menu/react\": \1,\n    \"@navigator.menu/types\": \"file:$WORKSPACE_ROOT/packages/types\",|g" package.json || true
fi

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

if [[ -n "$APP_TO_TEST" ]]; then
  # If a workspace app is used, ensure workspace and app dependencies are installed
  echo "   Installing workspace dependencies (root)..."
  if ! pnpm install --no-frozen-lockfile; then
    echo -e "${RED}❌ Failed to install workspace dependencies${NC}"
    exit 1
  fi
  echo "   Installing dependencies for app: $TEMP_APP_DIR"
  if ! (cd "$TEMP_APP_DIR" && pnpm install --no-frozen-lockfile); then
    echo -e "${RED}❌ Failed to install app dependencies${NC}"
    exit 1
  fi
else
  # Install dependencies in the temp app directory
  # file: protocol will link to local packages
  if ! pnpm install --dir="$TEMP_APP_DIR" --no-frozen-lockfile; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
  fi
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

if [[ -n "$APP_TO_TEST" ]]; then
  # For workspace apps, node_modules may be in workspace root
  if [ ! -d "$TEMP_APP_DIR/node_modules/@navigator.menu/core" ] && [ ! -d "$WORKSPACE_ROOT/node_modules/@navigator.menu/core" ]; then
    echo -e "${RED}❌ @navigator.menu/core not found${NC}"
    exit 1
  fi

  if [ ! -d "$TEMP_APP_DIR/node_modules/@navigator.menu/react" ] && [ ! -d "$WORKSPACE_ROOT/node_modules/@navigator.menu/react" ]; then
    echo -e "${RED}❌ @navigator.menu/react not found${NC}"
    exit 1
  fi
else
  if [ ! -d "$TEMP_APP_DIR/node_modules/@navigator.menu/core" ]; then
    echo -e "${RED}❌ @navigator.menu/core not found${NC}"
    exit 1
  fi

  if [ ! -d "$TEMP_APP_DIR/node_modules/@navigator.menu/react" ]; then
    echo -e "${RED}❌ @navigator.menu/react not found${NC}"
    exit 1
  fi
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
echo "   [$(date +%H:%M:%S)] Initializing server..."

# Check if port is already in use
if lsof -i :5173 > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Port 5173 already in use!${NC}"
  echo "   Attempting to kill existing process..."
  kill $(lsof -t -i :5173) 2>/dev/null || true
  sleep 2
fi

# Ensure port is free and start server at explicit port
WORKSPACE_ROOT_ABS="$(pwd)"
echo "   [$(date +%H:%M:%S)] Verifying port ${SERVER_PORT} is free..."
if lsof -i :${SERVER_PORT} > /dev/null 2>&1; then
  echo "   ⚠️ Port ${SERVER_PORT} is in use. Attempting to kill existing process..."
  kill $(lsof -t -i:${SERVER_PORT}) 2>/dev/null || true
  sleep 1
fi
echo "   [$(date +%H:%M:%S)] Starting Vite preview on explicit port ${SERVER_PORT}..."
if [[ -n "$APP_TO_TEST" ]]; then
  # If testing an app inside the workspace, ensure the app is built
  echo "   Building app: $TEMP_APP_DIR"
  (cd "$TEMP_APP_DIR" && pnpm build) > /dev/null 2>&1 || true
fi
(cd "$TEMP_APP_DIR" && pnpm preview --port "${SERVER_PORT}") > "$SERVER_LOG" 2>&1 &
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
