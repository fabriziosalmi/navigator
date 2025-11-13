#!/usr/bin/env bash
set -euo pipefail

# Wrapper to run E2E tests for all configured Playwright projects.
# This calls the parameterized run-e2e-tests.sh for each project in sequence
# so each app is started/stopped in isolation.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNNER="$SCRIPT_DIR/run-e2e-tests.sh"

if [ ! -x "$RUNNER" ]; then
  echo "Runner not found or not executable: $RUNNER"
  exit 1
fi

echo "Running E2E for ReactTestApp..."
bash "$RUNNER" ReactTestApp
RC1=$?

echo "Running E2E for CognitiveShowcase..."
bash "$RUNNER" CognitiveShowcase
RC2=$?

if [ $RC1 -ne 0 ] || [ $RC2 -ne 0 ]; then
  echo "One or more E2E projects failed: ReactTestApp=$RC1 CognitiveShowcase=$RC2"
  exit 1
fi

echo "All E2E projects completed successfully"
exit 0
