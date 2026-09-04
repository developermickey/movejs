import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts', 'src/create.ts'],
  format: ['esm'],
  dts: true,
  splitting: true,
  clean: false,
  banner: { js: '#!/usr/bin/env node' }
});