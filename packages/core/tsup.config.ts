import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'jsx-runtime': 'src/jsx/jsx-runtime.ts'
  },
  format: ['esm'],
  dts: true,
  clean: true
});
