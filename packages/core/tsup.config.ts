import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    EventBus: 'src/EventBus.ts',
    AppState: 'src/AppState.ts',
    NavigatorCore: 'src/NavigatorCore.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  minify: false, // For debugging during development
  target: 'es2022'
});
