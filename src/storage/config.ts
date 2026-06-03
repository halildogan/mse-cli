import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import type { MseConfig } from '../types';

const DIR_NAME = '.mse';
const FILE_NAME = 'config.json';

/** Resolves the config directory, honoring the `MSE_CONFIG_DIR` override (tests). */
export function configDir(): string {
  const override = process.env.MSE_CONFIG_DIR;
  if (override && override.trim() !== '') return override;
  return join(homedir(), DIR_NAME);
}

/** Absolute path to the config file. */
export function configPath(): string {
  return join(configDir(), FILE_NAME);
}

const EMPTY_CONFIG: MseConfig = { version: 1 };

/** Reads config from disk. Missing or corrupt files yield an empty config. */
export async function readConfig(): Promise<MseConfig> {
  const path = configPath();
  if (!existsSync(path)) return { ...EMPTY_CONFIG };
  try {
    const raw = await readFile(path, 'utf8');
    const parsed = JSON.parse(raw) as Partial<MseConfig>;
    return {
      version: 1,
      openai: parsed.openai,
      defaults: parsed.defaults,
    };
  } catch {
    // A malformed config must never crash the tool.
    return { ...EMPTY_CONFIG };
  }
}

/** Persists config with locked-down permissions (dir 0700, file 0600). */
export async function writeConfig(config: MseConfig): Promise<void> {
  const dir = configDir();
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const path = configPath();
  const serialized = `${JSON.stringify({ ...config, version: 1 }, null, 2)}\n`;
  await writeFile(path, serialized, { mode: 0o600 });
  // Enforce perms even if the file already existed with looser bits.
  try {
    await chmod(path, 0o600);
  } catch {
    // Best-effort on platforms that don't support chmod (e.g. Windows).
  }
}

/** Merges and persists the `openai` section. */
export async function setOpenAiConfig(update: { apiKey?: string; model?: string }): Promise<void> {
  const current = await readConfig();
  const openai = { ...current.openai };
  if (update.apiKey !== undefined) openai.apiKey = update.apiKey;
  if (update.model !== undefined) openai.model = update.model;
  await writeConfig({ ...current, version: 1, openai });
}

/** Returns the stored API key, or `undefined` if none. */
export async function getStoredApiKey(): Promise<string | undefined> {
  const config = await readConfig();
  const key = config.openai?.apiKey;
  return key && key.trim() !== '' ? key.trim() : undefined;
}

/** Returns the stored default model, or `undefined` if none. */
export async function getStoredModel(): Promise<string | undefined> {
  const config = await readConfig();
  const model = config.openai?.model;
  return model && model.trim() !== '' ? model.trim() : undefined;
}

/** Returns the stored default run count, or `undefined` if none. */
export async function getDefaultRuns(): Promise<number | undefined> {
  const config = await readConfig();
  const runs = config.defaults?.runs;
  return typeof runs === 'number' && Number.isFinite(runs) ? runs : undefined;
}
