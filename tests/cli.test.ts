import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run } from '../src/cli/index';
import { getStoredApiKey, getStoredModel, getDefaultRuns } from '../src/storage/config';

let dir: string;
const ORIGINAL_DIR = process.env.MSE_CONFIG_DIR;
const ORIGINAL_KEY = process.env.OPENAI_API_KEY;
let out: string[];
let outSpy: ReturnType<typeof vi.spyOn>;
let errSpy: ReturnType<typeof vi.spyOn>;

const argv = (...a: string[]): string[] => ['node', 'mse', ...a];

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'mse-cli-'));
  process.env.MSE_CONFIG_DIR = dir;
  delete process.env.OPENAI_API_KEY;
  out = [];
  outSpy = vi.spyOn(process.stdout, 'write').mockImplementation(((c: unknown): boolean => {
    out.push(typeof c === 'string' ? c : String(c));
    return true;
  }) as typeof process.stdout.write);
  errSpy = vi.spyOn(process.stderr, 'write').mockImplementation((() => true) as typeof process.stderr.write);
  process.exitCode = 0;
});

afterEach(async () => {
  outSpy.mockRestore();
  errSpy.mockRestore();
  process.exitCode = 0;
  if (ORIGINAL_DIR === undefined) delete process.env.MSE_CONFIG_DIR;
  else process.env.MSE_CONFIG_DIR = ORIGINAL_DIR;
  if (ORIGINAL_KEY === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = ORIGINAL_KEY;
  await rm(dir, { recursive: true, force: true });
});

describe('CLI: init', () => {
  it('stores the key via --api-key (regression: options must reach the init subcommand)', async () => {
    await run(argv('init', '--api-key', 'sk-clitest1234567', '--model', 'gpt-4o'));
    expect(await getStoredApiKey()).toBe('sk-clitest1234567');
    expect(await getStoredModel()).toBe('gpt-4o');
    expect(process.exitCode).toBe(0);
  });
});

describe('CLI: config', () => {
  it('config --json emits JSON with a masked key (regression: --json must reach show)', async () => {
    await run(argv('init', '--api-key', 'sk-abcdefgh12345'));
    out.length = 0;
    await run(argv('config', '--json'));
    const parsed = JSON.parse(out.join(''));
    expect(parsed.openai.apiKeySet).toBe(true);
    expect(JSON.stringify(parsed)).not.toContain('sk-abcdefgh12345');
  });

  it('config set runs persists and is used as the default', async () => {
    await run(argv('config', 'set', 'runs', '3210'));
    expect(await getDefaultRuns()).toBe(3210);
    out.length = 0;
    await run(argv('a generic decision', '--seed', '1', '--json'));
    expect(JSON.parse(out.join('')).runs).toBe(3210);
  });
});

describe('CLI: run (default command)', () => {
  it('runs a scenario and emits JSON', async () => {
    await run(argv('launch a SaaS startup', '--seed', '1', '--json'));
    const parsed = JSON.parse(out.join(''));
    expect(parsed.templateName).toBe('startup');
    expect(parsed.successProbability).toBeGreaterThanOrEqual(0);
    expect(process.exitCode).toBe(0);
  });

  it('exits 3 when AI is requested without a key', async () => {
    await run(argv('open a cafe', '--ai', 'openai'));
    expect(process.exitCode).toBe(3);
  });

  it('exits 2 on a bad --runs value', async () => {
    await run(argv('x decision', '--runs', 'abc'));
    expect(process.exitCode).toBe(2);
  });
});
