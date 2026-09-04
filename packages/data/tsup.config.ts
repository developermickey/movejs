import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  external: ['pg', 'mysql2', 'mysql2/promise', 'better-sqlite3', 'mongodb']
});
