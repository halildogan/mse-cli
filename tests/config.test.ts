import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  configDir,
  configPath,
  readConfig,
  writeConfig,
  setOpenAiConfig,
  getStoredApiKey,
  getStoredModel,
  getDefaultRuns,
} from '../src/storage/config';

let dir: string;
const ORIGINAL = process.env.MSE_CONFIG_DIR;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'mse-test-'));
  process.env.MSE_CONFIG_DIR = dir;
});

afterEach(async () => {
  if (ORIGINAL === undefined) delete process.env.MSE_CONFIG_DIR;
  else process.env.MSE_CONFIG_DIR = ORIGINAL;
  await rm(dir, { recursive: true, force: true });
});

describe('config storage', () => {
  it('returns an empty config when none exists', async () => {
    const cfg = await readConfig();
    expect(cfg.version).toBe(1);
    expect(cfg.openai?.apiKey).toBeUndefined();
  });

  it('round-trips an API key and model', async () => {
    await setOpenAiConfig({ apiKey: 'sk-test-123456', model: 'gpt-4o-mini' });
    expect(await getStoredApiKey()).toBe('sk-test-123456');
    expect(await getStoredModel()).toBe('gpt-4o-mini');
  });

  it('writes the file with 0600 permissions', async () => {
    await setOpenAiConfig({ apiKey: 'sk-perm-check' });
    const info = await stat(configPath());
    expect(info.mode & 0o777).toBe(0o600);
  });

  it('merges updates without dropping prior values', async () => {
    await setOpenAiConfig({ apiKey: 'sk-aaa' });
    await setOpenAiConfig({ model: 'gpt-4o' });
    expect(await getStoredApiKey()).toBe('sk-aaa');
    expect(await getStoredModel()).toBe('gpt-4o');
  });

  it('treats a corrupt file as empty rather than throwing', async () => {
    await writeConfig({ version: 1, openai: { apiKey: 'sk-x' } });
    await writeFile(configPath(), '{ not valid json');
    const cfg = await readConfig();
    expect(cfg.openai?.apiKey).toBeUndefined();
  });

  it('reads a stored default run count', async () => {
    await writeConfig({ version: 1, defaults: { runs: 2500 } });
    expect(await getDefaultRuns()).toBe(2500);
  });

  it('honors the MSE_CONFIG_DIR override', () => {
    expect(configDir()).toBe(dir);
  });
});
