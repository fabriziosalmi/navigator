#!/bin/bash
#
# E2E Tests Validator
# Runs Playwright tests with development server lifecycle management
#

set -e

echo "🎭 Running E2E tests..."
echo ""

# Check if playwright test command is available
if ! command -v playwright &> /dev/null; then
  echo "⚠️  Playwright not found"
  echo "ℹ️  Skipping E2E tests"
  exit 0
fi

# Define cleanup function to kill server on exit
cleanup() {
  if [ ! -z "$SERVER_PID" ]; then
    echo "🛑 Stopping development server (PID: $SERVER_PID)..."
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
  fi
}

# Register cleanup to run on exit (success or failure)
trap cleanup EXIT

# Start development server in background
echo "🚀 Starting development server..."
pnpm --filter="react-test-app" run dev > /dev/null 2>&1 &
SERVER_PID=$!

echo "⏳ Waiting for server to be ready at http://localhost:5173..."

# Wait for server to be ready (max 60 seconds)
if command -v wait-on &> /dev/null; then
  wait-on http://localhost:5173 --timeout 60000
else
  # Fallback: simple curl polling if wait-on not available
  TIMEOUT=60
  ELAPSED=0
  while [ $ELAPSED -lt $TIMEOUT ]; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
      echo "✅ Server ready!"
      break
    fi
    sleep 2
    ELAPSED=$((ELAPSED + 2))
  done
  
  if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "❌ Server failed to start within $TIMEOUT seconds"
    exit 1
  fi
fi

echo ""
echo "🎬 Running Playwright tests..."
echo ""

# Run Playwright tests
pnpm playwright test

echo ""
echo "✅ E2E tests completed"
