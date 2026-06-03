import { Command, CommanderError } from 'commander';
import { Chalk } from 'chalk';
import ora from 'ora';
import { runSimulation } from '../core/engine';
import { formatResult } from '../output/formatter';
import { runInit } from './init';
import { runConfigClear, runConfigPath, runConfigSet, runConfigShow } from './config';
import { getStoredApiKey, getStoredModel, getDefaultRuns } from '../storage/config';
import { DEFAULT_OPENAI_MODEL, DEFAULT_RUNS, MAX_RUNS, MIN_RUNS, VERSION } from '../constants';
import { listTemplateNames } from '../templates';
import { ExitCode, MissingApiKeyError, MseError, UsageError, errorMessage } from '../util/errors';
import { redact } from '../util/redact';
import type { EngineOptions } from '../types';

interface ScenarioCliOptions {
  ai?: string;
  apiKey?: string;
  model?: string;
  runs?: string;
  seed?: string;
  template?: string;
  json: boolean;
  explain: boolean;
  color: boolean;
}

function parseRuns(value: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new UsageError(`--runs must be an integer (received "${value}").`);
  }
  if (n < MIN_RUNS || n > MAX_RUNS) {
    throw new UsageError(`--runs must be between ${MIN_RUNS} and ${MAX_RUNS}.`);
  }
  return n;
}

function parseSeed(value: string | undefined): number | null {
  if (value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new UsageError(`--seed must be an integer (received "${value}").`);
  }
  return n;
}

/** Resolves runs: explicit --runs, else the saved default, else the built-in default. */
async function resolveRuns(value: string | undefined): Promise<number> {
  if (value !== undefined) return parseRuns(value);
  const stored = await getDefaultRuns();
  if (stored !== undefined && Number.isInteger(stored) && stored >= MIN_RUNS && stored <= MAX_RUNS) {
    return stored;
  }
  return DEFAULT_RUNS;
}

/** Resolves the API key in priority order: flag -> env -> stored config. */
async function resolveApiKey(flagValue: string | undefined): Promise<string | undefined> {
  const flag = (flagValue ?? '').trim();
  if (flag !== '') return flag;
  const env = (process.env.OPENAI_API_KEY ?? '').trim();
  if (env !== '') return env;
  return getStoredApiKey();
}

async function runScenario(scenarioArg: string | undefined, opts: ScenarioCliOptions): Promise<void> {
  if (!scenarioArg || scenarioArg.trim() === '') {
    throw new UsageError(
      'A scenario is required, e.g. mse "start freelancing as a developer". Run `mse --help`.',
    );
  }

  const runs = await resolveRuns(opts.runs);
  const seed = parseSeed(opts.seed);
  const useAi = opts.ai !== undefined;

  if (useAi && String(opts.ai).toLowerCase() !== 'openai') {
    throw new UsageError(`Unsupported AI provider "${opts.ai}". Supported providers: openai.`);
  }

  const engineOptions: EngineOptions = {
    scenario: scenarioArg,
    runs,
    seed,
    useAi,
    explain: opts.explain === true,
  };
  if (opts.template) engineOptions.template = opts.template;

  if (useAi) {
    const apiKey = await resolveApiKey(opts.apiKey);
    if (!apiKey) throw new MissingApiKeyError();
    engineOptions.apiKey = apiKey;
    engineOptions.model = (opts.model ?? '').trim() || (await getStoredModel()) || DEFAULT_OPENAI_MODEL;
  }

  // Spinner only for the AI (network) path, and only in non-JSON mode. It writes
  // to stderr so stdout stays clean and pipeable.
  const spinner =
    useAi && !opts.json ? ora({ text: 'Consulting OpenAI…', stream: process.stderr }).start() : null;

  try {
    const result = await runSimulation(engineOptions);
    spinner?.stop();
    const text = formatResult(result, { json: opts.json === true, color: opts.color !== false });
    process.stdout.write(`${text}\n`);
  } catch (err) {
    spinner?.stop();
    throw err;
  }
}

function buildProgram(): Command {
  const program = new Command();

  program
    .name('mse')
    .description(
      'Micro Simulation Engine — model uncertainty in human decisions with Monte Carlo simulation.',
    )
    .version(VERSION, '-v, --version', 'output the version number')
    .showHelpAfterError('(add --help for usage)')
    .addHelpText(
      'after',
      [
        '',
        'Examples:',
        '  $ mse "start freelancing as a developer"',
        '  $ mse "launch a SaaS startup" --runs 5000 --seed 42',
        '  $ mse "should I switch careers" --json',
        '  $ mse "open a coffee shop" --ai openai --explain',
        '  $ mse init',
        '  $ mse config            # show stored config (key masked)',
        '',
        'API key resolution (AI mode): --api-key, then OPENAI_API_KEY, then ~/.mse/config.json.',
      ].join('\n'),
    );

  // Default command — lets `mse "scenario"` work without typing a subcommand.
  program
    .command('run [scenario]', { isDefault: true })
    .description('Run a simulation for a decision scenario (this is the default command).')
    .option('--ai <provider>', 'enable AI-assisted factor extraction (provider: openai)')
    .option('--api-key <key>', 'OpenAI API key override (AI mode only)')
    .option('--model <model>', 'OpenAI model override (AI mode only)')
    .option('--runs <n>', `number of Monte Carlo runs (default ${DEFAULT_RUNS}, or your saved default)`)
    .option('--seed <n>', 'integer seed for a deterministic, reproducible run')
    .option('--template <name>', `force a built-in template (${listTemplateNames().join(', ')})`)
    .option('--json', 'output machine-readable JSON', false)
    .option('--explain', 'include the factor breakdown / reasoning', false)
    .option('--no-color', 'disable colored output')
    .action(async (scenario: string | undefined, opts: ScenarioCliOptions) => {
      await runScenario(scenario, opts);
    });

  program
    .command('init')
    .description('Store your OpenAI API key and default model locally (~/.mse/config.json).')
    .option('--api-key <key>', 'set the API key non-interactively')
    .option('--model <model>', 'set the default OpenAI model')
    .action(async (opts: { apiKey?: string; model?: string }) => {
      await runInit({ apiKey: opts.apiKey, model: opts.model });
    });

  // `mse config` shows the stored config; subcommands set/clear/path manage it.
  const config = program
    .command('config')
    .description('Inspect or clear stored configuration (~/.mse/config.json).')
    .option('--json', 'output as JSON', false)
    .option('--no-color', 'disable colored output')
    .action(async (opts: { json: boolean; color: boolean }) => {
      await runConfigShow({ json: opts.json === true, color: opts.color !== false });
    });

  config
    .command('set <field> <value>')
    .description('Set a stored value. Fields: model, runs. (Use `mse init` for the API key.)')
    .action(async (field: string, value: string) => {
      await runConfigSet(field, value);
    });

  config
    .command('clear')
    .description('Clear stored configuration. With no flags, clears everything.')
    .option('--key', 'clear only the stored API key')
    .option('--model', 'clear only the stored model')
    .option('--runs', 'clear only the stored default runs')
    .option('--all', 'clear everything (default when no flag is given)')
    .action(async (opts: { key?: boolean; model?: boolean; runs?: boolean; all?: boolean }) => {
      await runConfigClear(opts);
    });

  config
    .command('path')
    .description('Print the path to the config file.')
    .action(() => {
      runConfigPath();
    });

  return program;
}

/** CLI entry point. Parses argv, maps errors to exit codes, and redacts secrets. */
export async function run(argv: string[]): Promise<void> {
  const program = buildProgram();
  program.exitOverride();

  try {
    await program.parseAsync(argv);
  } catch (err) {
    if (err instanceof CommanderError) {
      // Help/version/usage handling already printed output; just relay the code.
      process.exitCode = err.exitCode;
      return;
    }
    const code = err instanceof MseError ? err.exitCode : ExitCode.Runtime;
    const c = new Chalk({});
    process.stderr.write(`${c.red('Error:')} ${redact(errorMessage(err))}\n`);
    process.exitCode = code;
  }
}
