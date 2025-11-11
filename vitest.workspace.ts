import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  // All packages in the monorepo
  'packages/*',
  // Apps if they have tests
  {
    test: {
      name: 'demo-app',
      include: ['apps/demo/tests/**/*.{test,spec}.{ts,js}'],
      environment: 'jsdom',
    }
  },
  {
    test: {
      name: 'react-demo',
      include: ['apps/react-demo/tests/**/*.{test,spec}.{ts,tsx,js,jsx}'],
      environment: 'jsdom',
    }
  }
]);
