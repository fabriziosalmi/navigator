import { defineWorkspace } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

// Base configuration with path resolution
const baseConfig = {
  plugins: [tsconfigPaths()],
};

export default defineWorkspace([
  // All packages in the monorepo with path resolution
  {
    extends: './vitest.config.ts',
    ...baseConfig,
    test: {
      name: 'packages',
      include: ['packages/*/tests/**/*.{test,spec}.{ts,js}'],
    }
  },
  // Apps if they have tests
  {
    ...baseConfig,
    test: {
      name: 'demo-app',
      include: ['apps/pdk-demo/tests/**/*.{test,spec}.{ts,js}'],
      environment: 'jsdom',
    }
  },
  {
    ...baseConfig,
    test: {
      name: 'react-demo',
      include: ['apps/react-demo/tests/**/*.{test,spec}.{ts,tsx,js,jsx}'],
      environment: 'jsdom',
    }
  }
]);
