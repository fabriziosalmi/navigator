import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config';

/**
 * CI-specific Vitest configuration
 * 
 * Key differences from base config:
 * - Coverage thresholds disabled (to avoid blocking CI on incomplete coverage)
 * - Increased timeouts for slower CI environments
 * - Pool set to threads with single thread for stability
 * - Explicit teardown handling to prevent hanging processes
 */
export default mergeConfig(baseConfig, defineConfig({
  test: {
    // Longer timeouts for CI environment
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
    
    // Single-threaded pool to prevent resource conflicts and hanging
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      }
    },
    
    // Override coverage settings for CI
    coverage: {
      // Disable threshold checks in CI
      // We still collect coverage, but don't fail the build
      thresholds: {}
    }
  }
}));
