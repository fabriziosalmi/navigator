# E2E Test Timeout Debugging Plan - v11.3

## Problem Statement

**Symptom**: E2E test orchestrator (`scripts/run-e2e-tests.sh`) fails with server startup timeout  
**Error**: `curl` polling reaches 60-second timeout before Vite dev server responds  
**Impact**: E2E tests disabled in validation pipeline (blocking full CI/CD coverage)  
**Priority**: HIGH (blocks test automation completeness)

---

## Hypothesis Tree

### 🔍 Hypothesis 1: Vite Startup Time Exceeds Timeout (Most Likely)

**Theory**: The Vite dev server takes longer than 60 seconds to become responsive, especially:
- On first run (cold start with dependency pre-bundling)
- In CI environments (resource-constrained containers)
- With large dependency graphs (Navigator SDK packages)

**Evidence to Check**:
```bash
# Measure actual startup time locally
time (cd /tmp/e2e-test-app && pnpm vite --port 5174 &)
# Wait for "Local: http://localhost:5174" message
# Record timestamp

# Expected: < 10s locally, may be > 60s in CI
```

**Debugging Steps**:
1. Add verbose logging to `run-e2e-tests.sh`:
   ```bash
   echo "[$(date +%H:%M:%S)] Starting Vite server..."
   pnpm vite --port 5174 > server.log 2>&1 &
   SERVER_PID=$!
   echo "[$(date +%H:%M:%S)] Server PID: $SERVER_PID"
   
   # Tail server logs in background
   tail -f server.log &
   TAIL_PID=$!
   ```

2. Increase curl polling timeout from 60s to 120s:
   ```bash
   TIMEOUT=120  # Was: 60
   ```

3. Reduce polling interval for faster detection:
   ```bash
   INTERVAL=2  # Was: 5 (more frequent checks)
   ```

4. Check server process health during polling:
   ```bash
   while [ $ELAPSED -lt $TIMEOUT ]; do
       if ! kill -0 $SERVER_PID 2>/dev/null; then
           echo "❌ Server process died! Check server.log"
           exit 1
       fi
       # ... rest of curl polling
   done
   ```

**Fix Candidates**:
- Increase `TIMEOUT` to 120-180s
- Add `--force` flag to Vite (skip optimization cache)
- Use `vite preview` instead of `vite` (pre-built app, faster startup)

---

### 🔍 Hypothesis 2: Port Conflict / Wrong URL (Medium Likelihood)

**Theory**: Another process is using port 5174, or the polling URL is incorrect

**Evidence to Check**:
```bash
# Before starting server
lsof -i :5174  # Should return nothing

# After starting server (from another terminal)
lsof -i :5174  # Should show Vite process
curl -I http://localhost:5174  # Should return 200 OK
```

**Debugging Steps**:
1. Add pre-flight port check:
   ```bash
   if lsof -i :5174 > /dev/null 2>&1; then
       echo "⚠️  Port 5174 already in use!"
       lsof -i :5174
       echo "Attempting to kill existing process..."
       kill $(lsof -t -i :5174) 2>/dev/null
       sleep 2
   fi
   ```

2. Dynamic port allocation with `get-port-cli`:
   ```bash
   # Install in scripts/
   pnpm add -D get-port-cli
   
   # Use in script
   PORT=$(get-port)
   echo "Using dynamic port: $PORT"
   pnpm vite --port $PORT &
   # ... update Playwright config with PORT env var
   ```

3. Enhanced URL verification:
   ```bash
   # Instead of just curl http://localhost:5174
   echo "Checking server response headers..."
   curl -I http://localhost:5174 2>&1 | tee curl-debug.log
   
   # Verify HTML response (not just 200 OK)
   curl -s http://localhost:5174 | grep -q "<title>" || {
       echo "❌ Server returned 200 but no HTML!"
   }
   ```

**Fix Candidates**:
- Implement dynamic port allocation
- Add robust port conflict detection
- Use `wait-on` package (more reliable than curl polling)

---

### 🔍 Hypothesis 3: Race Condition in Dependencies (Low Likelihood)

**Theory**: pnpm install or file: protocol dependency linking is incomplete when Vite starts

**Evidence to Check**:
```bash
# After pnpm install in test app
ls -la /tmp/e2e-test-app/node_modules/@navigator.menu/
# Should show symlinks to ../../packages/*

# Check if packages are built
ls -la packages/core/dist/
# Should have index.js, index.d.ts, etc.
```

**Debugging Steps**:
1. Ensure packages are built before E2E:
   ```bash
   echo "Building Navigator SDK packages..."
   pnpm build --filter '@navigator.menu/*'
   
   echo "Copying test template..."
   # ... rest of script
   ```

2. Add dependency verification:
   ```bash
   echo "Verifying test app dependencies..."
   cd "$TEST_DIR"
   pnpm list @navigator.menu/core || {
       echo "❌ Core package not linked!"
       exit 1
   }
   ```

3. Test with published packages instead of file: links:
   ```bash
   # Temporarily use npm registry versions
   # If this works, issue is in local linking
   ```

**Fix Candidates**:
- Add explicit `pnpm build` before template copy
- Use `pnpm install --frozen-lockfile` in test app
- Switch to using published packages for E2E

---

## Environment-Specific Considerations

### Local vs CI Differences

| Factor | Local (MacOS M4) | GitHub Actions (Ubuntu) | Impact |
|--------|------------------|-------------------------|--------|
| CPU | 10 cores | 2 cores (free tier) | 5x slower builds |
| RAM | 32 GB | 7 GB | Potential swap usage |
| Disk | SSD (fast) | Standard (slower I/O) | Slower npm installs |
| Network | Fast | Variable | CDN dependency fetches |
| Node Version | 22.x | 20.x (default) | Compatibility issues? |

**Debugging Steps**:
1. Run E2E locally in "degraded mode":
   ```bash
   # Limit resources to simulate CI
   docker run --cpus=2 --memory=4g -it node:20 bash
   # Clone repo, run E2E
   ```

2. Add CI-specific configuration:
   ```bash
   if [ -n "$CI" ]; then
       echo "Running in CI mode - adjusting timeouts..."
       TIMEOUT=180  # 3 minutes for CI
       VITE_ARGS="--force"  # Skip optimization cache
   else
       TIMEOUT=60
       VITE_ARGS=""
   fi
   ```

---

## Recommended Action Plan (Ordered by Priority)

### Phase 1: Quick Wins (< 30 minutes)
1. ✅ **Add verbose logging** to `run-e2e-tests.sh`
2. ✅ **Increase timeout** to 120s
3. ✅ **Redirect server logs** to file for inspection
4. ✅ **Test locally** to establish baseline

### Phase 2: Structural Fixes (1-2 hours)
5. ⏳ **Implement dynamic port allocation** with `get-port-cli`
6. ⏳ **Add server health checks** (process alive, HTTP response valid)
7. ⏳ **Switch to `wait-on` package** for robust polling
8. ⏳ **Add pre-flight checks** (port availability, dependencies built)

### Phase 3: CI Optimization (2-4 hours)
9. ⏳ **Environment detection** (local vs CI timeout adjustment)
10. ⏳ **Dependency caching** in GitHub Actions
11. ⏳ **Pre-built test app** (skip vite optimization on each run)
12. ⏳ **Parallel E2E execution** (split tests across jobs)

---

## Success Criteria

- [ ] E2E script completes successfully **locally** (baseline)
- [ ] Server starts within **< 30s locally**, **< 90s in CI**
- [ ] Playwright tests execute without timeout errors
- [ ] E2E re-enabled in `validate-ecosystem.sh`
- [ ] CI pipeline shows **6/6 green checks** (including E2E)

---

## Monitoring & Alerts

Once fixed, add telemetry:
```bash
# In run-e2e-tests.sh
echo "📊 E2E Metrics:"
echo "  Server startup: ${STARTUP_TIME}s"
echo "  Test duration: ${TEST_DURATION}s"
echo "  Total time: ${TOTAL_TIME}s"

# Log to file for trending
echo "$(date),${STARTUP_TIME},${TEST_DURATION}" >> e2e-metrics.csv
```

---

## Next Steps (After Documentation)

1. **Implement Phase 1 fixes** (verbose logging + timeout increase)
2. **Run local test** to reproduce or verify fix
3. **Commit changes** with descriptive message
4. **Monitor CI** for green E2E check
5. **Re-enable E2E** in validation pipeline

**Estimated Total Time**: 2-4 hours (including testing iterations)

---

**Document Version**: 1.0  
**Author**: Navigator DevOps Team  
**Priority**: HIGH  
**Blocked By**: None (ready to start)  
**Blocks**: Full CI/CD coverage, automated regression testing
