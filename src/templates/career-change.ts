import type { DecisionTemplate } from './index';

/**
 * Changing careers / switching to a different profession.
 */
export const careerChangeTemplate: DecisionTemplate = {
  name: 'career-change',
  description: 'Changing careers or switching to a different profession.',
  keywords: [
    'career change',
    'change careers',
    'change my career',
    'changing careers',
    'switch careers',
    'career switch',
    'switch jobs',
    'new career',
    'pivot careers',
    'change professions',
    'become a',
    'retrain',
  ],
  factors: [
    { name: 'Transferable skills', score: 0.6, weight: 0.25, direction: 1 },
    { name: 'Financial cushion', score: 0.5, weight: 0.2, direction: 1 },
    { name: 'Income disruption risk', score: 0.55, weight: 0.2, direction: -1 },
    { name: 'Demand in target field', score: 0.6, weight: 0.2, direction: 1 },
    { name: 'Re-skilling effort', score: 0.5, weight: 0.15, direction: -1 },
  ],
};
