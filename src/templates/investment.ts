import type { DecisionTemplate } from './index';

/**
 * Making a financial investment (markets, funds, crypto, etc.).
 *
 * This models the favorability of a generic investment decision — it is NOT
 * financial advice, just a structured way to reason about the uncertainty.
 */
export const investmentTemplate: DecisionTemplate = {
  name: 'investment',
  description: 'Making a financial investment (markets, funds, crypto).',
  keywords: [
    'invest',
    'investing',
    'investment',
    'stock',
    'stock market',
    'crypto',
    'bitcoin',
    'portfolio',
    'mutual fund',
    'index fund',
    'etf',
    'buy shares',
    'put money into',
  ],
  factors: [
    { name: 'Expected return', score: 0.55, weight: 0.2, direction: 1 },
    { name: 'Market volatility', score: 0.6, weight: 0.25, direction: -1 },
    { name: 'Time horizon', score: 0.6, weight: 0.2, direction: 1 },
    { name: 'Diversification', score: 0.55, weight: 0.15, direction: 1 },
    { name: 'Liquidity / downside exposure', score: 0.5, weight: 0.2, direction: -1 },
  ],
};
