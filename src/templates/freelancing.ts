import type { DecisionTemplate } from './index';

/**
 * Going independent — freelancing or consulting.
 */
export const freelancingTemplate: DecisionTemplate = {
  name: 'freelancing',
  description: 'Going independent as a freelancer or consultant.',
  keywords: [
    'freelanc',
    'consult',
    'self-employed',
    'self employed',
    'go independent',
    'contracting',
    'contractor',
    'gig',
    'solo',
    'upwork',
    'client work',
  ],
  factors: [
    { name: 'Client acquisition', score: 0.55, weight: 0.25, direction: 1 },
    { name: 'Income stability', score: 0.45, weight: 0.2, direction: 1 },
    { name: 'Market competition', score: 0.6, weight: 0.15, direction: -1 },
    { name: 'Skill & portfolio', score: 0.65, weight: 0.2, direction: 1 },
    { name: 'Financial runway', score: 0.5, weight: 0.2, direction: 1 },
  ],
};
