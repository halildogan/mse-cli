import { describe, it, expect } from 'vitest';
import {
  simulate,
  riskLevelFor,
  computeKeyFactors,
  effectiveFavorability,
} from '../src/core/simulator';
import { normalizeFactors } from '../src/core/weights';

describe('simulate — determinism', () => {
  it('produces identical results for the same seed', () => {
    const factors = normalizeFactors([
      { name: 'a', score: 0.6, weight: 0.5, direction: 1 },
      { name: 'b', score: 0.4, weight: 0.5, direction: -1 },
    ]);
    const r1 = simulate({ factors, runs: 2000, seed: 123 });
    const r2 = simulate({ factors, runs: 2000, seed: 123 });
    expect(r1).toEqual(r2);
  });

  it('varies across different seeds', () => {
    const factors = normalizeFactors([{ name: 'a', score: 0.6, weight: 1, direction: 1 }]);
    const r1 = simulate({ factors, runs: 2000, seed: 1 });
    const r2 = simulate({ factors, runs: 2000, seed: 2 });
    expect(r1.meanLikelihood).not.toBe(r2.meanLikelihood);
  });
});

describe('simulate — correctness', () => {
  it('strong tailwinds yield a high success probability', () => {
    const factors = normalizeFactors([{ name: 'a', score: 0.95, weight: 1, direction: 1 }]);
    const r = simulate({ factors, runs: 5000, seed: 42 });
    expect(r.successProbability).toBeGreaterThan(0.8);
  });

  it('strong headwinds yield a low success probability', () => {
    const factors = normalizeFactors([{ name: 'a', score: 0.95, weight: 1, direction: -1 }]);
    const r = simulate({ factors, runs: 5000, seed: 42 });
    expect(r.successProbability).toBeLessThan(0.2);
  });

  it('neutral favorability sits near 0.5', () => {
    const factors = normalizeFactors([{ name: 'a', score: 0.5, weight: 1, direction: 1 }]);
    const r = simulate({ factors, runs: 5000, seed: 7 });
    expect(r.successProbability).toBeGreaterThan(0.4);
    expect(r.successProbability).toBeLessThan(0.6);
  });

  it('is monotonic: higher favorability never lowers the probability', () => {
    const low = simulate({
      factors: normalizeFactors([{ name: 'a', score: 0.4, weight: 1, direction: 1 }]),
      runs: 5000,
      seed: 99,
    });
    const high = simulate({
      factors: normalizeFactors([{ name: 'a', score: 0.8, weight: 1, direction: 1 }]),
      runs: 5000,
      seed: 99,
    });
    expect(high.successProbability).toBeGreaterThan(low.successProbability);
  });

  it('reports an ordered credible interval within [0,1]', () => {
    const factors = normalizeFactors([{ name: 'a', score: 0.7, weight: 1, direction: 1 }]);
    const r = simulate({ factors, runs: 3000, seed: 5 });
    expect(r.ci90[0]).toBeGreaterThanOrEqual(0);
    expect(r.ci90[1]).toBeLessThanOrEqual(1);
    expect(r.ci90[0]).toBeLessThanOrEqual(r.ci90[1]);
    expect(r.stdev).toBeGreaterThanOrEqual(0);
  });

  it('rejects invalid run counts', () => {
    const factors = normalizeFactors([{ name: 'a', score: 0.5, weight: 1 }]);
    expect(() => simulate({ factors, runs: 0, seed: 1 })).toThrow();
    expect(() => simulate({ factors, runs: 1.5, seed: 1 })).toThrow();
  });
});

describe('effectiveFavorability', () => {
  it('inverts headwind factors', () => {
    expect(effectiveFavorability({ name: 'x', score: 0.7, weight: 1, direction: 1, concentration: 8 })).toBeCloseTo(0.7);
    expect(effectiveFavorability({ name: 'x', score: 0.7, weight: 1, direction: -1, concentration: 8 })).toBeCloseTo(0.3);
  });
});

describe('riskLevelFor', () => {
  it('maps probabilities to qualitative bands', () => {
    expect(riskLevelFor(0.9)).toBe('Highly Favorable');
    expect(riskLevelFor(0.65)).toBe('Favorable');
    expect(riskLevelFor(0.5)).toBe('Uncertain');
    expect(riskLevelFor(0.35)).toBe('Risky');
    expect(riskLevelFor(0.1)).toBe('Highly Risky');
  });
});

describe('computeKeyFactors', () => {
  it('ranks by influence and labels effect', () => {
    const factors = normalizeFactors([
      { name: 'big', score: 0.9, weight: 0.7, direction: 1 },
      { name: 'small', score: 0.55, weight: 0.3, direction: 1 },
    ]);
    const kf = computeKeyFactors(factors);
    expect(kf[0].name).toBe('big');
    expect(kf[0].effect).toBe('tailwind');
    expect(kf[0].influence).toBeGreaterThan(kf[1].influence);
  });

  it('labels low effective favorability as a headwind', () => {
    const factors = normalizeFactors([{ name: 'risk', score: 0.9, weight: 1, direction: -1 }]);
    const kf = computeKeyFactors(factors);
    expect(kf[0].effect).toBe('headwind');
  });
});
