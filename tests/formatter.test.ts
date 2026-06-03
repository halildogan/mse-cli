import { describe, it, expect } from 'vitest';
import { formatResult } from '../src/output/formatter';
import type { SimulationResult } from '../src/types';

// ANSI escape (ESC) built without embedding a control byte in source.
const ESC = String.fromCharCode(27);
const ANSI = new RegExp(`${ESC}\\[[0-9;]*m`, 'g');
const stripAnsi = (s: string): string => s.replace(ANSI, '');

const sample: SimulationResult = {
  scenario: 'start freelancing',
  runs: 1000,
  seed: 42,
  successProbability: 0.6241,
  meanLikelihood: 0.61,
  ci90: [0.48, 0.75],
  stdev: 0.08,
  riskLevel: 'Favorable',
  keyFactors: [
    { name: 'Client acquisition', influence: 0.2, effect: 'tailwind' },
    { name: 'Market competition', influence: 0.1, effect: 'headwind' },
  ],
  source: 'template',
  templateName: 'freelancing',
};

describe('formatResult — JSON', () => {
  it('returns valid JSON matching the result', () => {
    const parsed = JSON.parse(formatResult(sample, { json: true, color: false }));
    expect(parsed.successProbability).toBeCloseTo(0.6241);
    expect(parsed.riskLevel).toBe('Favorable');
    expect(parsed.templateName).toBe('freelancing');
    expect(parsed.keyFactors).toHaveLength(2);
  });

  it('never includes secret-like fields', () => {
    const out = formatResult(sample, { json: true, color: false });
    expect(out).not.toMatch(/apikey|api_key|sk-/i);
  });
});

describe('formatResult — human', () => {
  it('contains the headline sections', () => {
    const out = stripAnsi(formatResult(sample, { json: false, color: false }));
    expect(out).toContain('Simulation Result');
    expect(out).toContain('Success Probability: 62.41%');
    expect(out).toContain('Risk Level: Favorable');
    expect(out).toContain('Client acquisition');
    expect(out).toContain('Market competition');
  });

  it('emits no ANSI escape codes when color is disabled', () => {
    const out = formatResult(sample, { json: false, color: false });
    expect(out.includes(ESC)).toBe(false);
  });
});
