import type { DecisionTemplate } from './index';

/**
 * A balanced, domain-agnostic decision model. Used as the base for keyword
 * extraction when no specific template matches the scenario. Its `keywords`
 * list is intentionally empty so it never wins template matching directly.
 */
export const genericTemplate: DecisionTemplate = {
  name: 'generic',
  description: 'A balanced, domain-agnostic decision model.',
  keywords: [],
  factors: [
    { name: 'Upside potential', score: 0.55, weight: 0.25, direction: 1 },
    { name: 'Personal readiness', score: 0.6, weight: 0.2, direction: 1 },
    { name: 'External / market risk', score: 0.5, weight: 0.2, direction: -1 },
    { name: 'Resource availability', score: 0.55, weight: 0.175, direction: 1 },
    { name: 'Uncertainty & unknowns', score: 0.5, weight: 0.175, direction: -1 },
  ],
};
