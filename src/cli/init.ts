import readline from 'node:readline';
import { configPath, setOpenAiConfig } from '../storage/config';
import { DEFAULT_OPENAI_MODEL } from '../constants';
import { UsageError } from '../util/errors';
import { maskKey } from '../util/redact';

export interface InitOptions {
  apiKey?: string;
  model?: string;
}

interface MutableReadline {
  stdoutMuted: boolean;
  _writeToOutput: (s: string) => void;
  output: NodeJS.WritableStream;
}

/**
 * Prompts on the terminal. When `hidden`, keystrokes are not echoed (for secrets).
 * Rejects if there is no interactive TTY.
 */
function prompt(question: string, hidden: boolean): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(
        new UsageError(
          'mse init requires an interactive terminal. Use `mse init --api-key <key>` or set OPENAI_API_KEY instead.',
        ),
      );
      return;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    const mutable = rl as unknown as MutableReadline;

    if (hidden) {
      mutable.stdoutMuted = true;
      mutable._writeToOutput = (stringToWrite: string) => {
        // Suppress echoed keystrokes; still honor the line break on Enter.
        if (!mutable.stdoutMuted || stringToWrite.includes('\n')) {
          mutable.output.write(stringToWrite.includes('\n') ? '\n' : stringToWrite);
        }
      };
      process.stdout.write(question);
    }

    rl.question(hidden ? '' : question, (answer) => {
      if (hidden) process.stdout.write('\n');
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * `mse init` — stores the OpenAI API key (and default model) locally.
 * Interactive by default; `--api-key`/`--model` allow non-interactive setup.
 * The key is never echoed or printed in full.
 */
export async function runInit(options: InitOptions): Promise<void> {
  let apiKey = options.apiKey?.trim();
  const interactive = apiKey === undefined;

  if (!apiKey) {
    apiKey = await prompt('Enter your OpenAI API key: ', true);
  }
  if (!apiKey) {
    throw new UsageError('No API key provided; nothing was saved.');
  }

  let model = options.model?.trim();
  if (!model && interactive) {
    const entered = await prompt(`Default model [${DEFAULT_OPENAI_MODEL}]: `, false);
    model = entered || DEFAULT_OPENAI_MODEL;
  }
  if (!model) model = DEFAULT_OPENAI_MODEL;

  await setOpenAiConfig({ apiKey, model });

  process.stdout.write(
    `\nSaved API key (${maskKey(apiKey)}) and model "${model}" to ${configPath()}\n`,
  );
  process.stdout.write(
    'The file is readable only by you (chmod 600) and is never printed or logged.\n',
  );
  if (!/^sk-/.test(apiKey)) {
    process.stdout.write(
      'Note: the key does not start with "sk-"; double-check it is a valid OpenAI key.\n',
    );
  }
}
