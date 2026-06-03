import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Hoisted mock handle so the vi.mock factory can reference it safely.
const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

// Replace the OpenAI SDK with a stub — no network is ever touched.
vi.mock('openai', () => ({
  default: class OpenAIMock {
    chat = { completions: { create: createMock } };
  },
}));

import { extractFactorsWithAi, resolveApiKeyFromEnv } from '../src/ai/provider';
import { runSimulation } from '../src/core/engine';
import type { EngineOptions } from '../src/types';

function mockOnce(payload: unknown): void {
  createMock.mockResolvedValueOnce({
    choices: [{ message: { content: JSON.stringify(payload) } }],
  });
}

function aiOptions(overrides: Partial<EngineOptions> = {}): EngineOptions {
  return {
    scenario: 'open a neighborhood cafe',
    runs: 1000,
    seed: 1,
    useAi: true,
    explain: false,
    apiKey: 'sk-mock-key',
    ...overrides,
  };
}

beforeEach(() => {
  createMock.mockReset();
});

describe('extractFactorsWithAi (mocked OpenAI)', () => {
  it('maps a valid AI response into a ParsedScenario', async () => {
    mockOnce({
      factors: [
        { name: 'Foot traffic', score: 0.7, weight: 0.5, direction: 1, reasoning: 'busy street' },
        { name: 'Competition', score: 0.6, weight: 0.5, direction: -1, reasoning: 'many cafes' },
      ],
      summary: 'A plausible but competitive venture.',
    });

    const parsed = await extractFactorsWithAi(aiOptions());
    expect(parsed.source).toBe('ai');
    expect(parsed.factors).toHaveLength(2);
    expect(parsed.factors[0].name).toBe('Foot traffic');
    expect(parsed.factors[1].direction).toBe(-1);
    expect(parsed.summary).toBe('A plausible but competitive venture.');
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it('throws when the response fails schema validation', async () => {
    // score out of range and only one factor (min is 2).
    mockOnce({ factors: [{ name: 'x', score: 5, weight: 0.5, direction: 1, reasoning: '' }], summary: '' });
    await expect(extractFactorsWithAi(aiOptions())).rejects.toThrow(/validation/i);
  });

  it('throws when the response is not valid JSON', async () => {
    createMock.mockResolvedValueOnce({ choices: [{ message: { content: 'not json' } }] });
    await expect(extractFactorsWithAi(aiOptions())).rejects.toThrow(/JSON/i);
  });

  it('throws MissingApiKeyError when no key is provided', async () => {
    const opts = aiOptions();
    delete opts.apiKey;
    await expect(extractFactorsWithAi(opts)).rejects.toThrow(/API key/i);
    expect(createMock).not.toHaveBeenCalled();
  });

  it('keeps the AI to factor extraction — the engine computes the probability', async () => {
    mockOnce({
      factors: [
        { name: 'A', score: 0.9, weight: 0.5, direction: 1, reasoning: '' },
        { name: 'B', score: 0.9, weight: 0.5, direction: 1, reasoning: '' },
      ],
      summary: '',
    });

    const result = await runSimulation(aiOptions({ runs: 4000, seed: 11 }));
    expect(result.source).toBe('ai');
    // Two strong tailwinds should drive a high probability — computed locally.
    expect(result.successProbability).toBeGreaterThan(0.7);
    expect(createMock).toHaveBeenCalledTimes(1);
  });
});

describe('resolveApiKeyFromEnv', () => {
  const ORIGINAL = process.env.OPENAI_API_KEY;
  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = ORIGINAL;
  });

  it('prefers an explicit key over the environment', () => {
    process.env.OPENAI_API_KEY = 'sk-env';
    expect(resolveApiKeyFromEnv('sk-flag')).toBe('sk-flag');
  });

  it('falls back to the environment variable', () => {
    process.env.OPENAI_API_KEY = 'sk-env-2';
    expect(resolveApiKeyFromEnv(undefined)).toBe('sk-env-2');
  });

  it('returns undefined when nothing is set', () => {
    delete process.env.OPENAI_API_KEY;
    expect(resolveApiKeyFromEnv('   ')).toBeUndefined();
  });
});
