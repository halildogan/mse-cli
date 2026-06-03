import type { DecisionTemplate } from './index';

/**
 * Founding or launching a startup / new business venture.
 *
 * Scores express each factor's typical *level* for this kind of decision;
 * `direction: -1` factors are headwinds whose presence reduces success.
 */
export const startupTemplate: DecisionTemplate = {
  name: 'startup',
  description: 'Founding or launching a startup or new business venture.',
  keywords: [
    'startup',
    'start up',
    'start a company',
    'found a company',
    'launch a business',
    'launch a startup',
    'new business',
    'venture',
    'co-founder',
    'cofounder',
    'saas',
    'raise funding',
    'seed round',
  ],
  factors: [
    { name: 'Market demand', score: 0.6, weight: 0.25, direction: 1 },
    { name: 'Funding & runway', score: 0.5, weight: 0.2, direction: 1 },
    { name: 'Competition intensity', score: 0.6, weight: 0.15, direction: -1 },
    { name: 'Team & execution', score: 0.6, weight: 0.2, direction: 1 },
    { name: 'Market & timing risk', score: 0.5, weight: 0.2, direction: -1 },
  ],
};
