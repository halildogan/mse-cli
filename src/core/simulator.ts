import type { Factor, FactorEffect, KeyFactor, RiskLevel } from '../types';
import { LOGISTIC_GAIN, RISK_THRESHOLDS, TOP_KEY_FACTORS } from '../constants';
import { resolveRng, sampleBeta, type Rng } from '../util/rng';

/** Input to a single simulation. Factors must already be weight-normalized. */
export interface SimulateInput {
  factors: Factor[];
  runs: number;
  seed: number | null;
}

/** Aggregate statistics produced by {@link simulate}. */
export interface SimulateStats {
  /** Monte Carlo estimate: successes / runs. */
  successProbability: number;
  /** Mean per-run success likelihood. */
  meanLikelihood: number;
  /** 90% credible interval `[p5, p95]` of the per-run likelihood. */
  ci90: [number, number];
  /** Standard deviation of the per-run likelihood. */
  stdev: number;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** Effective favorability of a factor after applying its direction. */
export function effectiveFavorability(factor: Factor): number {
  return factor.direction === 1 ? factor.score : 1 - factor.score;
}

/** Maps a success probability to a qualitative risk band. */
export function riskLevelFor(probability: number): RiskLevel {
  for (const threshold of RISK_THRESHOLDS) {
    if (probability >= threshold.min) return threshold.level;
  }
  return 'Highly Risky';
}

/** Linear-interpolated percentile of an ascending-sorted array. `q ∈ [0,1]`. */
function percentile(sortedAsc: Float64Array, q: number): number {
  const n = sortedAsc.length;
  if (n === 0) return 0;
  if (n === 1) return sortedAsc[0];
  const idx = q * (n - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const frac = idx - lo;
  return sortedAsc[lo] * (1 - frac) + sortedAsc[hi] * frac;
}

/**
 * Runs the Weighted Beta Sampling + Logistic Monte Carlo simulation.
 *
 * For each run and each factor we draw `x ~ Beta(α, β)` (α, β derived from the
 * factor's effective favorability and concentration), combine the draws as a
 * weighted, neutral-centered sum, pass that through a logistic to get a per-run
 * success likelihood `p`, then draw the run outcome as `Bernoulli(p)`.
 *
 * Deterministic for a fixed `seed`, `factors`, and `runs`.
 */
export function simulate(input: SimulateInput): SimulateStats {
  const { factors, runs, seed } = input;

  if (!Number.isInteger(runs) || runs < 1) {
    throw new RangeError('runs must be a positive integer');
  }
  if (factors.length === 0) {
    throw new RangeError('at least one factor is required');
  }

  const rng: Rng = resolveRng(seed);
  const count = factors.length;

  // Precompute Beta parameters and weights once.
  const alpha = new Float64Array(count);
  const beta = new Float64Array(count);
  const weight = new Float64Array(count);
  for (let i = 0; i < count; i++) {
    const f = factors[i];
    const fav = effectiveFavorability(f);
    alpha[i] = fav * f.concentration;
    beta[i] = (1 - fav) * f.concentration;
    weight[i] = f.weight;
  }

  const likelihoods = new Float64Array(runs);
  let successes = 0;
  let sumP = 0;

  for (let r = 0; r < runs; r++) {
    let agg = 0;
    for (let i = 0; i < count; i++) {
      const x = sampleBeta(rng, alpha[i], beta[i]);
      agg += weight[i] * (x - 0.5);
    }
    const p = sigmoid(LOGISTIC_GAIN * agg);
    likelihoods[r] = p;
    sumP += p;
    if (rng.next() < p) successes++;
  }

  const meanLikelihood = sumP / runs;

  let varianceAcc = 0;
  for (let r = 0; r < runs; r++) {
    const delta = likelihoods[r] - meanLikelihood;
    varianceAcc += delta * delta;
  }
  const stdev = Math.sqrt(varianceAcc / runs);

  const sorted = Float64Array.from(likelihoods).sort();
  const ci90: [number, number] = [percentile(sorted, 0.05), percentile(sorted, 0.95)];

  return {
    successProbability: successes / runs,
    meanLikelihood,
    ci90,
    stdev,
  };
}

/**
 * Ranks factors by influence (`weight × |effectiveFavorability − 0.5|`) and
 * labels each as a tailwind or headwind. Returns the top `topN`.
 */
export function computeKeyFactors(factors: Factor[], topN: number = TOP_KEY_FACTORS): KeyFactor[] {
  return factors
    .map((f): KeyFactor => {
      const fav = effectiveFavorability(f);
      const effect: FactorEffect = fav >= 0.5 ? 'tailwind' : 'headwind';
      return {
        name: f.name,
        influence: f.weight * Math.abs(fav - 0.5),
        effect,
      };
    })
    .sort((a, b) => b.influence - a.influence)
    .slice(0, topN);
}
