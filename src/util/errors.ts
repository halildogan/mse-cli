/**
 * Typed errors that map cleanly onto process exit codes.
 */

/** Process exit codes used across the CLI. */
export const ExitCode = {
  Success: 0,
  Runtime: 1,
  Usage: 2,
  MissingApiKey: 3,
} as const;

export type ExitCodeValue = (typeof ExitCode)[keyof typeof ExitCode];

/** Base class for errors that carry a specific process exit code. */
export class MseError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode: number = ExitCode.Runtime) {
    super(message);
    this.name = 'MseError';
    this.exitCode = exitCode;
  }
}

/** Invalid CLI usage / arguments. */
export class UsageError extends MseError {
  constructor(message: string) {
    super(message, ExitCode.Usage);
    this.name = 'UsageError';
  }
}

/** AI mode was requested but no API key could be resolved. */
export class MissingApiKeyError extends MseError {
  constructor(
    message = 'No OpenAI API key found. Run `mse init`, set OPENAI_API_KEY, or pass --api-key.',
  ) {
    super(message, ExitCode.MissingApiKey);
    this.name = 'MissingApiKeyError';
  }
}

/** A failure while talking to (or parsing the response from) the AI provider. */
export class AiError extends MseError {
  constructor(message: string) {
    super(message, ExitCode.Runtime);
    this.name = 'AiError';
  }
}

/** Narrows an unknown thrown value to a readable message. */
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
