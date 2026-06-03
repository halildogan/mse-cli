import type { RawFactor } from '../types';
import { startupTemplate } from './startup';
import { freelancingTemplate } from './freelancing';
import { genericTemplate } from './generic';

/** A reusable, domain-specific preset of decision factors. */
export interface DecisionTemplate {
  /** Lowercase identifier, e.g. "startup". */
  name: string;
  /** Short human description (shown in `--explain` and help text). */
  description: string;
  /** Lowercase substrings that, if present in a scenario, indicate a match. */
  keywords: string[];
  /** Preset factors (raw; normalized by the engine). */
  factors: RawFactor[];
}

/** Domain templates considered during matching. Order is the tie-break priority. */
export const TEMPLATES: readonly DecisionTemplate[] = [startupTemplate, freelancingTemplate];

/** Neutral, domain-agnostic fallback used by keyword extraction. */
export const GENERIC_TEMPLATE: DecisionTemplate = genericTemplate;

/** Resolves a template by exact (case-insensitive) name, including the generic one. */
export function getTemplateByName(name: string): DecisionTemplate | undefined {
  const normalized = name.trim().toLowerCase();
  if (normalized === GENERIC_TEMPLATE.name) return GENERIC_TEMPLATE;
  return TEMPLATES.find((template) => template.name === normalized);
}

/**
 * Returns the best-matching template for a scenario (most keyword hits), or
 * `undefined` when nothing matches.
 */
export function matchTemplate(scenario: string): DecisionTemplate | undefined {
  const text = scenario.toLowerCase();
  let best: { template: DecisionTemplate; hits: number } | undefined;

  for (const template of TEMPLATES) {
    let hits = 0;
    for (const keyword of template.keywords) {
      if (text.includes(keyword)) hits++;
    }
    if (hits > 0 && (best === undefined || hits > best.hits)) {
      best = { template, hits };
    }
  }

  return best?.template;
}

/** All selectable template names, including the generic fallback. */
export function listTemplateNames(): string[] {
  return [...TEMPLATES.map((t) => t.name), GENERIC_TEMPLATE.name];
}

export { startupTemplate, freelancingTemplate, genericTemplate };
