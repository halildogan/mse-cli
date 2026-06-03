import { describe, it, expect } from 'vitest';
import { normalizeFactors, clampScore } from '../src/core/weights';

describe('normalizeFactors', () => {
  it('normalizes weights to sum to 1', () => {
    const factors = normalizeFactors([
      { name: 'a', score: 0.5, weight: 2 },
      { name: 'b', score: 0.5, weight: 2 },
    ]);
    const sum = factors.reduce((s, f) => s + f.weight, 0);
    expect(sum).toBeCloseTo(1, 10);
    expect(factors[0].weight).toBeCloseTo(0.5, 10);
  });

  it('falls back to uniform weights when none are positive', () => {
    const factors = normalizeFactors([
      { name: 'a', score: 0.5 },
      { name: 'b', score: 0.5 },
      { name: 'c', score: 0.5 },
    ]);
    expect(factors[0].weight).toBeCloseTo(1 / 3, 10);
    const sum = factors.reduce((s, f) => s + f.weight, 0);
    expect(sum).toBeCloseTo(1, 10);
  });

  it('clamps scores strictly inside (0,1)', () => {
    const factors = normalizeFactors([
      { name: 'hi', score: 2, weight: 1 },
      { name: 'lo', score: -5, weight: 1 },
    ]);
    expect(factors[0].score).toBeLessThan(1);
    expect(factors[0].score).toBeGreaterThan(0);
    expect(factors[1].score).toBeGreaterThan(0);
  });

  it('floors concentration and defaults direction', () => {
    const factors = normalizeFactors([{ name: 'a', score: 0.5, weight: 1, concentration: 0 }]);
    expect(factors[0].concentration).toBeGreaterThanOrEqual(1);
    expect(factors[0].direction).toBe(1);
  });

  it('preserves an explicit headwind direction', () => {
    const factors = normalizeFactors([{ name: 'a', score: 0.5, weight: 1, direction: -1 }]);
    expect(factors[0].direction).toBe(-1);
  });

  it('throws on empty input', () => {
    expect(() => normalizeFactors([])).toThrow();
  });
});

describe('clampScore', () => {
  it('maps non-finite values to 0.5', () => {
    expect(clampScore(Number.NaN)).toBe(0.5);
    expect(clampScore(Number.POSITIVE_INFINITY)).toBeLessThan(1);
  });
});
