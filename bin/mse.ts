#!/usr/bin/env node
import { run } from '../src/cli/index';

// `run` handles all expected errors and sets process.exitCode itself; this
// guard only catches truly unexpected failures.
run(process.argv).catch((err: unknown) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
});
