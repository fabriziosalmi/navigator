#!/usr/bin/env bash

# Safety wrapper for E2E tests - ensures script completes within time limit

SCRIPT_DIR="$(dirname "$0")"
TIMEOUT=180  # 3 minutes max

echo "Running E2E tests with $TIMEOUT second timeout..."

if timeout $TIMEOUT bash "$SCRIPT_DIR/run-e2e-tests.sh"; then
  echo "✅ E2E tests completed successfully"
  exit 0
else
  EXIT_CODE=$?
  if [ $EXIT_CODE -eq 124 ]; then
    echo "❌ E2E tests timed out after $TIMEOUT seconds"
  else
    echo "❌ E2E tests failed with exit code: $EXIT_CODE"
  fi
  
  # Ensure cleanup
  pkill -f "vite.*5173" 2>/dev/null
  rm -rf /tmp/navigator-e2e-temp-app 2>/dev/null
  
  exit $EXIT_CODE
fi
