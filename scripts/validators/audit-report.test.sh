#!/bin/bash
#
# The classifier decides whether CI goes red. If it ever stops telling the four
# cases apart, the audit would go quiet exactly the way it did before this fix —
# looking like it ran, saying nothing. These fixtures are the real shapes pnpm
# emits, including the failure one.
#
set -e

here="$(dirname "$0")"
fail=0

expect() {
  local fixture="$1" want="$2"
  set +e
  node "$here/audit-report.js" "$here/fixtures/$fixture" > /dev/null 2>&1
  local got=$?
  set -e
  if [ "$got" != "$want" ]; then
    echo "   ✗ $fixture: expected exit $want, got $got"
    fail=1
  fi
}

# a report arrived, nothing critical
expect audit-clean.json 0
expect audit-high.json 0
# a report arrived and names a critical production vulnerability
expect audit-critical.json 3
# no report arrived
expect audit-timeout.json 4
expect audit-garbage.json 4

[ "$fail" = "0" ] || { echo "❌ audit-report.js no longer tells the cases apart"; exit 1; }
