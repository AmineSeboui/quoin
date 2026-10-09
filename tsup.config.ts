import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts', headless: 'src/headless.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ['react', 'react-dom'],
  banner: { js: "'use client';" },
});
