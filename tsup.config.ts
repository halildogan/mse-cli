import { defineConfig } from 'tsup';

/**
 * Build configuration.
 *
 * Entries use the object form so output paths are deterministic:
 *   { index: 'src/index.ts' }      -> dist/index.js   (library entry)
 *   { 'bin/mse': 'bin/mse.ts' }    -> dist/bin/mse.js (CLI entry, added in the CLI phase)
 *
 * The `openai` SDK is marked external and is lazily imported at runtime, so the
 * rule-based code path never loads it and CLI startup stays fast.
 */
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'bin/mse': 'bin/mse.ts',
  },
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  splitting: false,
  dts: false,
  shims: false,
  external: ['openai'],
});
