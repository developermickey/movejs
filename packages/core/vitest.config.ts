import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    pool: 'forks',
    include: ['tests/**/*.test.ts'],
    hookTimeout: 20000,
    testTimeout: 20000
  }
});
