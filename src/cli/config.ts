import { Chalk } from 'chalk';
import {
  clearConfigFields,
  configPath,
  readConfig,
  removeConfigFile,
  setDefaultRuns,
  setOpenAiConfig,
} from '../storage/config';
import { maskKey } from '../util/redact';
import { UsageError } from '../util/errors';
import { DEFAULT_OPENAI_MODEL, DEFAULT_RUNS, MAX_RUNS, MIN_RUNS } from '../constants';

export interface ConfigShowOptions {
  json: boolean;
  color: boolean;
}

/** `mse config show` — print the stored config. The API key is always masked. */
export async function runConfigShow(options: ConfigShowOptions): Promise<void> {
  const config = await readConfig();
  const apiKey = config.openai?.apiKey;
  const model = config.openai?.model;
  const runs = config.defaults?.runs;
  const hasKey = Boolean(apiKey && apiKey.trim() !== '');

  if (options.json) {
    // Emit the masked key only — never the raw value.
    const payload = {
      path: configPath(),
      openai: {
        apiKeySet: hasKey,
        apiKeyMasked: hasKey ? maskKey(apiKey as string) : null,
        model: model ?? null,
      },
      defaults: {
        runs: typeof runs === 'number' ? runs : null,
      },
    };
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  const c = new Chalk(options.color ? {} : { level: 0 });
  const lines: string[] = [];
  lines.push(c.bold('MSE configuration'));
  lines.push(c.dim('-----------------'));
  lines.push(`${c.bold('Config file:')}  ${configPath()}`);
  lines.push(`${c.bold('API key:')}      ${hasKey ? c.green(maskKey(apiKey as string)) : c.dim('(not set)')}`);
  lines.push(`${c.bold('Model:')}        ${model ? model : c.dim(`(default: ${DEFAULT_OPENAI_MODEL})`)}`);
  lines.push(
    `${c.bold('Default runs:')} ${typeof runs === 'number' ? String(runs) : c.dim(`(default: ${DEFAULT_RUNS})`)}`,
  );
  process.stdout.write(`${lines.join('\n')}\n`);
}

/** `mse config set <field> <value>` — set `model` or `runs`. The key uses `mse init`. */
export async function runConfigSet(field: string, value: string): Promise<void> {
  const key = field.trim().toLowerCase();

  if (key === 'model') {
    const model = value.trim();
    if (model === '') {
      throw new UsageError('Provide a model name, e.g. `mse config set model gpt-4o-mini`.');
    }
    await setOpenAiConfig({ model });
    process.stdout.write(`Set default model to "${model}".\n`);
    return;
  }

  if (key === 'runs') {
    const n = Number(value);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < MIN_RUNS || n > MAX_RUNS) {
      throw new UsageError(`runs must be an integer between ${MIN_RUNS} and ${MAX_RUNS}.`);
    }
    await setDefaultRuns(n);
    process.stdout.write(`Set default runs to ${n}.\n`);
    return;
  }

  if (key === 'apikey' || key === 'api-key' || key === 'key') {
    throw new UsageError(
      'For security, set the API key with `mse init` (input is hidden) — not `config set`.',
    );
  }

  throw new UsageError(
    `Unknown config field "${field}". Settable fields: model, runs. (Use \`mse init\` for the API key.)`,
  );
}

export interface ConfigClearOptions {
  key?: boolean;
  model?: boolean;
  runs?: boolean;
  all?: boolean;
}

/** `mse config clear` — clear selected fields, or everything when no flag is given. */
export async function runConfigClear(options: ConfigClearOptions): Promise<void> {
  const anySpecific = Boolean(options.key || options.model || options.runs);

  if (options.all || !anySpecific) {
    await removeConfigFile();
    process.stdout.write(`Cleared all stored configuration (removed ${configPath()}).\n`);
    return;
  }

  await clearConfigFields({ key: options.key, model: options.model, runs: options.runs });
  const cleared = [
    options.key ? 'API key' : null,
    options.model ? 'model' : null,
    options.runs ? 'default runs' : null,
  ]
    .filter((x): x is string => x !== null)
    .join(', ');
  process.stdout.write(`Cleared: ${cleared}.\n`);
}

/** `mse config path` — print the config file path. */
export function runConfigPath(): void {
  process.stdout.write(`${configPath()}\n`);
}
