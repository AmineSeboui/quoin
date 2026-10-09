import { defineConfig } from 'tsup';

const shared = {
  format: ['esm', 'cjs'] as ('esm' | 'cjs')[],
  dts: true,
  sourcemap: true,
  external: ['react', 'react-dom'],
};

// treeshake stays off: Rollup strips the module-level directive from the banner.
export default defineConfig([
  {
    ...shared,
    entry: { index: 'src/index.ts' },
    clean: true,
    banner: { js: "'use client';" },
  },
  {
    ...shared,
    entry: { headless: 'src/headless.ts' },
  },
]);
