import type { DecisionTemplate } from './index';

/**
 * Relocating — moving to a new city, region, or country.
 */
export const relocationTemplate: DecisionTemplate = {
  name: 'relocation',
  description: 'Relocating to a new city, region, or country.',
  keywords: [
    'relocat',
    'move to',
    'moving to',
    'move abroad',
    'move overseas',
    'move country',
    'move out of state',
    'move across the country',
    'new city',
    'emigrate',
    'moving cities',
  ],
  factors: [
    { name: 'Opportunity at destination', score: 0.6, weight: 0.25, direction: 1 },
    { name: 'Cost-of-living change', score: 0.5, weight: 0.2, direction: -1 },
    { name: 'Support network', score: 0.5, weight: 0.2, direction: 1 },
    { name: 'Moving cost & logistics', score: 0.55, weight: 0.15, direction: -1 },
    { name: 'Quality-of-life fit', score: 0.6, weight: 0.2, direction: 1 },
  ],
};
