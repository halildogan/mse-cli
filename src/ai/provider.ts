import type { EngineOptions, ParsedScenario, RawFactor } from '../types';
import { DEFAULT_OPENAI_MODEL } from '../constants';
import { AiError, MissingApiKeyError, errorMessage } from '../util/errors';
import { redactValue } from '../util/redact';
import { AI_JSON_SCHEMA, AiResponseSchema } from './schema';

const SYSTEM_PROMPT = [
  'You are a decision-analysis assistant for a Monte Carlo simulation engine.',
  'Given a described decision, identify 3 to 6 INDEPENDENT factors that determine whether it will succeed.',
  'For each factor provide:',
  '- name: a short label (a few words).',
  '- score: 0..1, the typical STRENGTH/LEVEL of this factor for the scenario.',
  '- weight: 0..1, the relative IMPORTANCE of this factor.',
  '- direction: 1 if more of this factor helps success, -1 if more of it hurts (a risk/headwind).',
  '- reasoning: one concise clause explaining the factor.',
  'Also provide a one-sentence summary of the decision.',
  'Do NOT compute or state an overall success probability or percentage — the engine computes that.',
].join('\n');

/**
 * Resolves the OpenAI API key, in priority order:
 *   1. an explicit value (CLI `--api-key`)
 *   2. the `OPENAI_API_KEY` environment variable
 *
 * The config-file fallback is layered on by the CLI (which owns storage access)
 * before the key reaches the engine. Returns `undefined` when nothing resolves.
 */
export function resolveApiKeyFromEnv(explicit?: string): string | undefined {
  if (explicit && explicit.trim() !== '') return explicit.trim();
  const fromEnv = process.env.OPENAI_API_KEY;
  if (fromEnv && fromEnv.trim() !== '') return fromEnv.trim();
  return undefined;
}

/**
 * Extracts decision factors from a scenario using OpenAI Structured Outputs.
 *
 * The OpenAI SDK is imported lazily so it is only loaded when AI mode is used.
 * The model never computes the probability — it only proposes factors, which
 * the local engine then simulates.
 */
export async function extractFactorsWithAi(options: EngineOptions): Promise<ParsedScenario> {
  const apiKey = options.apiKey?.trim();
  if (!apiKey) {
    throw new MissingApiKeyError();
  }
  const model = options.model?.trim() || DEFAULT_OPENAI_MODEL;

  let OpenAICtor: typeof import('openai').default;
  try {
    const mod = await import('openai');
    OpenAICtor = mod.default;
  } catch {
    throw new AiError('The "openai" package is not installed. Install it with: npm install openai');
  }

  const client = new OpenAICtor({ apiKey });

  let content: string | null | undefined;
  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: options.scenario },
      ],
      response_format: { type: 'json_schema', json_schema: AI_JSON_SCHEMA },
    });
    content = completion.choices[0]?.message?.content;
  } catch (err) {
    // Redact the key from any provider/network error before surfacing it.
    throw new AiError(redactValue(`OpenAI request failed: ${errorMessage(err)}`, apiKey));
  }

  if (!content) {
    throw new AiError('OpenAI returned an empty response.');
  }

  let payload: unknown;
  try {
    payload = JSON.parse(content);
  } catch {
    throw new AiError('Could not parse the AI response as JSON.');
  }

  const parsed = AiResponseSchema.safeParse(payload);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new AiError(`AI response failed validation: ${issues}`);
  }

  const factors: RawFactor[] = parsed.data.factors.map((f) => {
    const base: RawFactor = {
      name: f.name,
      score: f.score,
      weight: f.weight,
      direction: f.direction,
    };
    return f.reasoning ? { ...base, reasoning: f.reasoning } : base;
  });

  const result: ParsedScenario = {
    scenario: options.scenario,
    source: 'ai',
    factors,
  };
  if (parsed.data.summary) {
    result.summary = parsed.data.summary;
  }
  return result;
}
