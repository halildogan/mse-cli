import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { VERSION } from '../src/constants';

const here = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8')) as {
  version: string;
  bin?: Record<string, string>;
  dependencies?: Record<string, string>;
};

describe('package metadata', () => {
  it('keeps the VERSION constant in sync with package.json', () => {
    expect(VERSION).toBe(pkg.version);
  });

  it('exposes the mse binary', () => {
    expect(pkg.bin?.mse).toBe('dist/bin/mse.js');
  });

  it('declares the required runtime dependencies', () => {
    for (const dep of ['commander', 'chalk', 'ora', 'zod', 'openai']) {
      expect(pkg.dependencies?.[dep]).toBeTruthy();
    }
  });
});
