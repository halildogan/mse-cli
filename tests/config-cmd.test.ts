import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runConfigShow, runConfigSet, runConfigClear } from '../src/cli/config';
import { setOpenAiConfig, getStoredApiKey, getStoredModel, getDefaultRuns } from '../src/storage/config';

let dir: string;
const ORIGINAL = process.env.MSE_CONFIG_DIR;
let writes: string[];
let spy: ReturnType<typeof vi.spyOn>;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'mse-cfg-'));
  process.env.MSE_CONFIG_DIR = dir;
  writes = [];
  spy = vi.spyOn(process.stdout, 'write').mockImplementation(((chunk: unknown): boolean => {
    writes.push(typeof chunk === 'string' ? chunk : String(chunk));
    return true;
  }) as typeof process.stdout.write);
});

afterEach(async () => {
  spy.mockRestore();
  if (ORIGINAL === undefined) delete process.env.MSE_CONFIG_DIR;
  else process.env.MSE_CONFIG_DIR = ORIGINAL;
  await rm(dir, { recursive: true, force: true });
});

describe('config show', () => {
  it('masks the API key and never prints it in full', async () => {
    await setOpenAiConfig({ apiKey: 'sk-supersecretvalue1234', model: 'gpt-4o-mini' });
    await runConfigShow({ json: false, color: false });
    const text = writes.join('');
    expect(text).not.toContain('sk-supersecretvalue1234');
    expect(text).toContain('gpt-4o-mini');
    expect(text).toMatch(/sk-su/); // masked prefix is shown
  });

  it('JSON mode reports apiKeySet without exposing the raw key', async () => {
    await setOpenAiConfig({ apiKey: 'sk-abcdefgh1234' });
    await runConfigShow({ json: true, color: false });
    const parsed = JSON.parse(writes.join(''));
    expect(parsed.openai.apiKeySet).toBe(true);
    expect(JSON.stringify(parsed)).not.toContain('sk-abcdefgh1234');
  });

  it('reports not-set when empty', async () => {
    await runConfigShow({ json: true, color: false });
    const parsed = JSON.parse(writes.join(''));
    expect(parsed.openai.apiKeySet).toBe(false);
    expect(parsed.defaults.runs).toBeNull();
  });
});

describe('config set', () => {
  it('sets the default model', async () => {
    await runConfigSet('model', 'gpt-4o');
    expect(await getStoredModel()).toBe('gpt-4o');
  });

  it('sets the default runs', async () => {
    await runConfigSet('runs', '5000');
    expect(await getDefaultRuns()).toBe(5000);
  });

  it('rejects a non-integer runs value', async () => {
    await expect(runConfigSet('runs', 'abc')).rejects.toThrow();
  });

  it('refuses to set the API key (directs to init)', async () => {
    await expect(runConfigSet('apikey', 'sk-x')).rejects.toThrow(/init/i);
  });

  it('rejects unknown fields', async () => {
    await expect(runConfigSet('color', 'blue')).rejects.toThrow();
  });
});

describe('config clear', () => {
  it('clears everything by default', async () => {
    await setOpenAiConfig({ apiKey: 'sk-x', model: 'gpt-4o' });
    await runConfigClear({});
    expect(await getStoredApiKey()).toBeUndefined();
    expect(await getStoredModel()).toBeUndefined();
  });

  it('clears only the key when --key is given', async () => {
    await setOpenAiConfig({ apiKey: 'sk-x', model: 'gpt-4o' });
    await runConfigClear({ key: true });
    expect(await getStoredApiKey()).toBeUndefined();
    expect(await getStoredModel()).toBe('gpt-4o');
  });

  it('clears only the default runs when --runs is given', async () => {
    await setOpenAiConfig({ apiKey: 'sk-keep' });
    await runConfigSet('runs', '2500');
    await runConfigClear({ runs: true });
    expect(await getDefaultRuns()).toBeUndefined();
    expect(await getStoredApiKey()).toBe('sk-keep');
  });
});
