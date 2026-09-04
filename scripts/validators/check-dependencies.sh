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

# The classifier below decides whether this job goes red. Check it can still
# tell the four cases apart before trusting what it says about the real run.
bash "$(dirname "$0")/audit-report.test.sh"

# Run audit. Prints ALL advisories (low/moderate/high/critical) for visibility,
# but only FAILS the build on CRITICAL production vulnerabilities.
#
# Why not --audit-level=high? A "high" gate against the live npm advisory DB is a
# time-bomb: this job went from green to red with zero code changes, purely because
# new advisories were published. Every current "high" is a *transitive build/dev*
# dependency (vite, rollup, astro, h3, devalue, ...) pulled in by the demo
# apps/landing-page — none affect the published packages/* SDK, and none are
# critical. Ongoing dependency bumps are handled by Dependabot. Gating on
# "critical" keeps a real security backstop without failing CI on advisory churn.
#
# The second time-bomb is the service. `pnpm audit` posts to the npm advisory
# endpoint, and when that endpoint does not answer the command fails exactly the
# same way it fails when it finds a critical vulnerability: non-zero, and under
# `set -e` the whole job goes red saying "Dependency Check failed". Those are not
# the same event and must not read the same. A report that arrives is judged; a
# report that never arrives is reported as not having arrived.
#
# The two are told apart by the report itself: a real run prints JSON on stdout,
# a network failure prints an error and no JSON.

report="$(mktemp)"
errors="$(mktemp)"
trap 'rm -f "$report" "$errors"' EXIT

# Fewer retries than the default three. Waiting out 10s + 60s of backoff against
# an endpoint that is not answering costs two minutes of every run and changes
# nothing about the outcome. Set through the environment rather than a flag, so
# an unrecognised option cannot masquerade as the network failure below.
set +e
npm_config_fetch_retries=1 npm_config_fetch_timeout=20000 \
  pnpm audit --audit-level=critical --prod --json > "$report" 2> "$errors"
audit_status=$?
set -e

# What happened is decided by the report, not by pnpm's exit code, which is the
# same for "found a critical vulnerability" and "could not reach the service".
#
#   0 - a report arrived and nothing critical is in it
#   3 - a report arrived and it names a critical production vulnerability
#   4 - no report arrived
set +e
node "$(dirname "$0")/audit-report.js" "$report"
verdict=$?
set -e

case "$verdict" in
  0)
    ;;
  3)
    echo ""
    echo "❌ A critical production vulnerability is in the audit report."
    exit 1
    ;;
  *)
    echo "::warning title=Audit did not run::pnpm audit could not reach the npm advisory service, so nothing was checked. This is not a clean audit; it is no audit. The dependency check is not failing on it, because an unreachable service says nothing about this repository."
    echo ""
    echo "⚠️  Audit skipped: the advisory service did not answer (pnpm exited $audit_status)."
    tail -3 "$errors" | sed 's/^/      /'
    ;;
esac

echo ""
echo "✅ Dependency check completed"
