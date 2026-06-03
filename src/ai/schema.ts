import { z } from 'zod';

/**
 * Validation schema for a single factor returned by the AI. Bounds are enforced
 * here (the engine additionally clamps/normalizes), so a misbehaving model can
 * never produce out-of-range inputs to the simulator.
 */
export const AiFactorSchema = z.object({
  name: z.string().min(1).max(80),
  score: z.number().min(0).max(1),
  weight: z.number().min(0).max(1),
  direction: z.union([z.literal(1), z.literal(-1)]),
  reasoning: z.string().max(400).optional().default(''),
});

/** Validation schema for the full AI response. */
export const AiResponseSchema = z.object({
  factors: z.array(AiFactorSchema).min(2).max(8),
  summary: z.string().max(600).optional().default(''),
});

export type AiFactor = z.infer<typeof AiFactorSchema>;
export type AiResponse = z.infer<typeof AiResponseSchema>;

/**
 * JSON Schema handed to OpenAI Structured Outputs (`response_format`).
 *
 * Restricted to keywords supported by strict mode: every property is listed in
 * `required` and `additionalProperties` is false. Numeric range/length limits
 * are intentionally omitted here and enforced by the zod schema above.
 */
export const AI_JSON_SCHEMA = {
  name: 'decision_factors',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      factors: {
        type: 'array',
        description: '3 to 6 independent factors that determine whether the decision succeeds.',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: { type: 'string', description: 'Short factor label, a few words.' },
            score: {
              type: 'number',
              description: 'Strength/level of this factor for the scenario, between 0 and 1.',
            },
            weight: {
              type: 'number',
              description: 'Relative importance of this factor, between 0 and 1.',
            },
            direction: {
              type: 'integer',
              enum: [1, -1],
              description: '1 if more of this factor helps success, -1 if it is a risk/headwind.',
            },
            reasoning: { type: 'string', description: 'One concise clause explaining the factor.' },
          },
          required: ['name', 'score', 'weight', 'direction', 'reasoning'],
        },
      },
      summary: {
        type: 'string',
        description: 'One-sentence overview. Do NOT state a probability or percentage.',
      },
    },
    required: ['factors', 'summary'],
  },
} as const;
