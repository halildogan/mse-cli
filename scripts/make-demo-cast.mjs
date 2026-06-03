#!/usr/bin/env node
/**
 * Generates assets/demo.cast (asciinema v2) from REAL CLI output — no TTY or
 * asciinema binary required. Each command is "typed" then its actual colored
 * output (captured with FORCE_COLOR) is streamed, so the demo never drifts from
 * the tool's true behavior.
 *
 * Usage:
 *   npm run build
 *   node scripts/make-demo-cast.mjs
 *   npx svg-term-cli --in assets/demo.cast --out assets/demo.svg --window --width 84
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

const BIN = 'dist/bin/mse.js';
const COLS = 84;
const ROWS = 22;
const ESC = String.fromCharCode(27); // build ANSI sequences without literal control bytes

if (!existsSync(BIN)) {
  console.error(`x ${BIN} not found. Run "npm run build" first.`);
  process.exit(1);
}

// Isolated config dir so `init` + `config` are self-contained and repeatable.
const configDir = mkdtempSync(join(tmpdir(), 'mse-demo-'));
const env = { ...process.env, FORCE_COLOR: '3', MSE_CONFIG_DIR: configDir };

const steps = [
  ['start freelancing as a developer', '--seed', '42'],
  ['should I invest in an index fund', '--seed', '7'],
  ['init', '--api-key', 'sk-demo-1a2b3c4d5e6f', '--model', 'gpt-4o'],
  ['config'],
];

function runCli(args) {
  try {
    return execFileSync('node', [BIN, ...args], { env, encoding: 'utf8' });
  } catch (err) {
    return `${err.stdout ?? ''}${err.stderr ?? ''}`;
  }
}

function displayCommand(args) {
  const parts = args.map((a) => (a.includes(' ') ? `"${a}"` : a));
  return `mse ${parts.join(' ')}`;
}

const PROMPT = `${ESC}[1;32m$${ESC}[0m `; // bold green "$"
const events = [];
let t = 0.6;
const emit = (data) => events.push([Number(t.toFixed(3)), 'o', data]);

for (const args of steps) {
  emit(PROMPT);
  for (const ch of displayCommand(args)) {
    t += 0.045;
    emit(ch);
  }
  t += 0.35;
  emit('\r\n');
  const output = runCli(args).replace(/\r?\n/g, '\r\n');
  t += 0.15;
  emit(output);
  t += 1.5; // pause to read
}
emit(PROMPT);
t += 1.0;

const header = {
  version: 2,
  width: COLS,
  height: ROWS,
  timestamp: 0,
  title: 'mse-cli demo',
  env: { TERM: 'xterm-256color', SHELL: '/bin/bash' },
};

mkdirSync('assets', { recursive: true });
const lines = [JSON.stringify(header), ...events.map((e) => JSON.stringify(e))];
writeFileSync('assets/demo.cast', `${lines.join('\n')}\n`);
console.log(`Wrote assets/demo.cast (${events.length} events, ~${t.toFixed(1)}s runtime).`);
