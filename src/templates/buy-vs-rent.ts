import type { DecisionTemplate } from './index';

/**
 * Buying a home versus renting. Factors express the favorability of *buying*.
 */
export const buyVsRentTemplate: DecisionTemplate = {
  name: 'buy-vs-rent',
  description: 'Buying a home versus continuing to rent.',
  keywords: [
    'buy vs rent',
    'rent vs buy',
    'rent or buy',
    'buy or rent',
    'buy a house',
    'buy a home',
    'buying a house',
    'buying a home',
    'buy property',
    'mortgage',
    'renting',
    'homeownership',
    'down payment',
  ],
  factors: [
    { name: 'Financial readiness', score: 0.55, weight: 0.25, direction: 1 },
    { name: 'Local affordability (price-to-rent)', score: 0.55, weight: 0.2, direction: -1 },
    { name: 'Time horizon & stability', score: 0.6, weight: 0.2, direction: 1 },
    { name: 'Interest / mortgage cost', score: 0.55, weight: 0.15, direction: -1 },
    { name: 'Maintenance & lost flexibility', score: 0.5, weight: 0.2, direction: -1 },
  ],
};
