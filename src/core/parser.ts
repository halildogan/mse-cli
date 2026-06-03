import type { ParsedScenario, RawFactor } from '../types';
import { MAX_SCENARIO_LENGTH } from '../constants';
import { UsageError } from '../util/errors';
import { GENERIC_TEMPLATE, getTemplateByName, listTemplateNames, matchTemplate } from '../templates';

/**
 * Removes ASCII control characters except tab (9), line feed (10) and carriage
 * return (13) — which the whitespace collapse step normalizes. Implemented with
 * numeric char-code checks to avoid embedding control bytes in source.
 */
function stripControlChars(input: string): string {
  let out = '';
  for (const ch of input) {
    const code = ch.codePointAt(0) ?? 0;
    const isAllowedWhitespace = code === 9 || code === 10 || code === 13;
    const isPrintable = code >= 32 && code !== 127;
    if (isAllowedWhitespace || isPrintable) {
      out += ch;
    }
  }
  return out;
}

/** Cleans raw scenario input: strips control chars, collapses whitespace, caps length. */
export function sanitizeScenario(raw: string): string {
  if (typeof raw !== 'string') {
    throw new UsageError('Scenario must be a string.');
  }
  const stripped = stripControlChars(raw).replace(/\s+/g, ' ').trim();
  if (stripped.length === 0) {
    throw new UsageError(
      'Scenario text is empty. Provide a decision to model, e.g. mse "start freelancing".',
    );
  }
  return stripped.length > MAX_SCENARIO_LENGTH ? stripped.slice(0, MAX_SCENARIO_LENGTH) : stripped;
}

// Lightweight sentiment cues used only by the keyword fallback.
const POSITIVE_CUES = [
  'experience',
  'experienced',
  'passion',
  'savings',
  'demand',
  'growth',
  'growing',
  'stable',
  'stability',
  'support',
  'skill',
  'skilled',
  'network',
  'proven',
  'strong',
  'opportunity',
  'profitable',
  'runway',
  'mentor',
  'traction',
  'confident',
];

const NEGATIVE_CUES = [
  'risk',
  'risky',
  'debt',
  'loan',
  'uncertain',
  'uncertainty',
  'competition',
  'competitive',
  'unstable',
  'fear',
  'recession',
  'crowded',
  'burnout',
  'inexperienced',
  'no savings',
  'no experience',
  'volatile',
  'layoff',
  'expensive',
];

function countCues(text: string, cues: string[]): number {
  let n = 0;
  for (const cue of cues) {
    if (text.includes(cue)) n++;
  }
  return n;
}

/**
 * Derives factors for an unmatched scenario by adjusting the generic template's
 * favorability based on simple positive/negative sentiment cues in the text.
 * Deterministic and explainable.
 */
export function keywordFactors(scenario: string): RawFactor[] {
  const text = scenario.toLowerCase();
  const positive = countCues(text, POSITIVE_CUES);
  const negative = countCues(text, NEGATIVE_CUES);
  // Net sentiment shifts favorability by up to +/- 0.2.
  const delta = Math.max(-0.2, Math.min(0.2, (positive - negative) * 0.05));

  return GENERIC_TEMPLATE.factors.map((factor): RawFactor => {
    const direction = factor.direction ?? 1;
    // Positive net sentiment lifts tailwinds and softens headwinds.
    const adjusted = direction === 1 ? factor.score + delta : factor.score - delta;
    const score = Math.max(0, Math.min(1, adjusted));
    return { ...factor, score };
  });
}

/**
 * Converts scenario text into a {@link ParsedScenario} using the rule-based
 * pipeline: explicit template -> keyword-matched template -> generic keyword
 * fallback.
 */
export function parseScenario(
  rawScenario: string,
  opts: { template?: string } = {},
): ParsedScenario {
  const scenario = sanitizeScenario(rawScenario);

  if (opts.template) {
    const template = getTemplateByName(opts.template);
    if (!template) {
      throw new UsageError(
        `Unknown template "${opts.template}". Available templates: ${listTemplateNames().join(', ')}.`,
      );
    }
    return {
      scenario,
      source: 'template',
      templateName: template.name,
      factors: template.factors.map((f) => ({ ...f })),
    };
  }

  const matched = matchTemplate(scenario);
  if (matched) {
    return {
      scenario,
      source: 'template',
      templateName: matched.name,
      factors: matched.factors.map((f) => ({ ...f })),
    };
  }

  return {
    scenario,
    source: 'keyword',
    factors: keywordFactors(scenario),
  };
}
