import type { Factor, RawFactor } from '../types';
import { DEFAULT_CONCENTRATION, MIN_CONCENTRATION, SCORE_EPSILON } from '../constants';

/** Clamps a score strictly inside `(0, 1)` so Beta parameters stay positive. */
export function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0.5;
  return Math.min(1 - SCORE_EPSILON, Math.max(SCORE_EPSILON, score));
}

/**
 * Normalizes raw factors into engine-ready {@link Factor}s:
 *  - clamps scores into `(0, 1)`
 *  - floors concentration and applies a default when missing
 *  - defaults direction to `+1`
 *  - normalizes weights so they sum to 1 (uniform when no positive weights given)
 *
 * @throws if `raw` is empty.
 */
export function normalizeFactors(raw: RawFactor[]): Factor[] {
  if (raw.length === 0) {
    throw new Error('Cannot normalize an empty factor set.');
  }

  const cleaned: Factor[] = raw.map((f) => {
    const hasWeight = typeof f.weight === 'number' && Number.isFinite(f.weight) && f.weight > 0;
    const concentration =
      typeof f.concentration === 'number' && Number.isFinite(f.concentration)
        ? Math.max(MIN_CONCENTRATION, f.concentration)
        : DEFAULT_CONCENTRATION;
    const direction: 1 | -1 = f.direction === -1 ? -1 : 1;
    const name = f.name.trim() === '' ? 'Unnamed factor' : f.name.trim();

    const base: Factor = {
      name,
      score: clampScore(f.score),
      weight: hasWeight ? (f.weight as number) : 0,
      direction,
      concentration,
    };
    return f.reasoning ? { ...base, reasoning: f.reasoning } : base;
  });

  const total = cleaned.reduce((sum, f) => sum + f.weight, 0);

  if (total <= 0) {
    const uniform = 1 / cleaned.length;
    return cleaned.map((f) => ({ ...f, weight: uniform }));
  }

  return cleaned.map((f) => ({ ...f, weight: f.weight / total }));
}
