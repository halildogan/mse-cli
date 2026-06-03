#!/usr/bin/env node
/**
 * Core isolation guard.
 *
 * Enforces the project's first principle — "the simulation engine is
 * deterministic and sacred" — by failing if any file in the protected core
 * imports the AI layer, performs network I/O, spawns a process, reads the
 * environment (secrets), or reaches into storage.
 *
 * The orchestrator (src/core/engine.ts) is the only bridge to the AI layer and
 * is allowed to load it *lazily* via `await import('../ai/provider')`. A static
 * AI import anywhere in the core is forbidden and will be flagged.
 *
 * Run with: node scripts/check-core-isolation.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const PROTECTED_DIRS = ['src/core', 'src/templates', 'src/util'];

const RULES = [
  { re: /from\s+['"]openai['"]/, msg: 'static import of "openai"' },
  { re: /import\(\s*['"]openai['"]\s*\)/, msg: 'dynamic import of "openai"' },
  { re: /from\s+['"][^'"]*\/ai\/[^'"]*['"]/, msg: 'static import from the AI layer' },
  {
    re: /from\s+['"]node:(http|https|net|tls|dgram|dns|child_process|cluster)['"]/,
    msg: 'network / process Node builtin',
  },
  { re: /from\s+['"](http|https|node-fetch|axios|undici|got|node:http2)['"]/, msg: 'HTTP dependency' },
  { re: /\bfetch\s*\(/, msg: 'use of fetch()' },
  { re: /from\s+['"][^'"]*\/storage\/[^'"]*['"]/, msg: 'import from storage (secrets/config)' },
  { re: /\bprocess\.env\b/, msg: 'reading process.env (no secrets in the core)' },
];

/** Recursively collect .ts files under a directory. */
function collect(dir) {
  const found = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return found;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...collect(full));
    } else if (full.endsWith('.ts')) {
      found.push(full);
    }
  }
  return found;
}

const files = PROTECTED_DIRS.flatMap(collect).sort();
const violations = [];

for (const file of files) {
  const normalized = file.replace(/\\/g, '/');
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    // Skip line comments to avoid false positives in prose.
    const code = line.replace(/\/\/.*$/, '');
    for (const rule of RULES) {
      if (rule.re.test(code)) {
        violations.push({ file: normalized, line: index + 1, msg: rule.msg, text: line.trim() });
      }
    }
  });
}

if (violations.length > 0) {
  console.error('✗ Core isolation guard FAILED — the deterministic core is sacred.\n');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.msg}`);
    console.error(`      ${v.text}`);
  }
  console.error(
    `\n${violations.length} violation(s). The core (${PROTECTED_DIRS.join(', ')}) must not ` +
      'import the AI layer, network, child_process, storage, or process.env.',
  );
  process.exit(1);
}

console.log(`✓ Core isolation guard passed (${files.length} protected files clean).`);
