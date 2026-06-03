#!/usr/bin/env node
/**
 * Integration-level determinism gate.
 *
 * Runs the BUILT CLI (dist/bin/mse.js) and asserts:
 *   1. identical (scenario, seed, runs) -> byte-identical output, and
 *   2. different seeds -> different output (a sanity check that the seed matters).
 *
 * Requires `npm run build` to have produced dist/bin/mse.js first.
 *
 * Run with: node scripts/check-determinism.mjs
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import process from 'node:process';

const BIN = 'dist/bin/mse.js';

if (!existsSync(BIN)) {
  console.error(`✗ ${BIN} not found. Run "npm run build" first.`);
  process.exit(1);
}

function hash(args) {
  const out = execFileSync('node', [BIN, ...args], { encoding: 'utf8' });
  return createHash('sha256').update(out).digest('hex');
}

const REPRODUCIBLE_CASES = [
  ['start freelancing as a developer', '--seed', '42', '--runs', '2000', '--json'],
  ['launch a SaaS startup', '--seed', '7', '--runs', '3000', '--json'],
  ['should I move to a new city', '--seed', '123', '--runs', '1500', '--json'],
];

let failed = false;

for (const args of REPRODUCIBLE_CASES) {
  const a = hash(args);
  const b = hash(args);
  const ok = a === b;
  console.log(`${ok ? '✓' : '✗'} reproducible: mse "${args[0]}" ${args.slice(1).join(' ')}`);
  if (!ok) {
    failed = true;
    console.error(`    run 1: ${a}`);
    console.error(`    run 2: ${b}`);
  }
}

// Different seeds must produce different output.
const seedA = hash(['career change decision', '--seed', '1', '--runs', '2000', '--json']);
const seedB = hash(['career change decision', '--seed', '2', '--runs', '2000', '--json']);
if (seedA === seedB) {
  failed = true;
  console.error('✗ sensitivity: two different seeds produced identical output');
} else {
  console.log('✓ sensitivity: different seeds produce different output');
}

if (failed) {
  console.error('\n✗ Determinism gate FAILED.');
  process.exit(1);
}
console.log('\n✓ Determinism gate passed.');
