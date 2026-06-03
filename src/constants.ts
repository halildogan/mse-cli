import type { RiskLevel } from './types';

/** CLI version. Kept in sync with package.json (verified by tests). */
export const VERSION = '0.1.0';

/** Default number of Monte Carlo runs. */
export const DEFAULT_RUNS = 1000;

/** Default Beta concentration `κ` (confidence in a factor's score). */
export const DEFAULT_CONCENTRATION = 8;

/** Logistic gain applied to the weighted, neutral-centered aggregate. */
export const LOGISTIC_GAIN = 6;

/** Clamp bound keeping favorability strictly inside (0,1) for valid Beta params. */
export const SCORE_EPSILON = 1e-3;

/** Minimum allowed Beta concentration. */
export const MIN_CONCENTRATION = 1;

/** Hard cap on accepted scenario length (characters). */
export const MAX_SCENARIO_LENGTH = 2000;

/** Allowed bounds for the number of runs a user may request. */
export const MIN_RUNS = 1;
export const MAX_RUNS = 10_000_000;

/** Default OpenAI model used when none is configured. */
export const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

/** Number of key factors surfaced in the result. */
export const TOP_KEY_FACTORS = 5;

/**
 * Risk-level thresholds on the success probability, evaluated high → low.
 * The first entry whose `min` is ≤ the probability wins.
 */
export const RISK_THRESHOLDS: ReadonlyArray<{ readonly min: number; readonly level: RiskLevel }> = [
  { min: 0.75, level: 'Highly Favorable' },
  { min: 0.6, level: 'Favorable' },
  { min: 0.45, level: 'Uncertain' },
  { min: 0.3, level: 'Risky' },
  { min: 0, level: 'Highly Risky' },
];
