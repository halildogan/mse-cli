/**
 * Public library surface for the Micro Simulation Engine.
 *
 * The package ships primarily as a CLI (`mse`), but the core engine is exported
 * here so it can be embedded programmatically. Importing this entry never loads
 * the OpenAI SDK — `runSimulation` pulls it in lazily, and only in AI mode.
 */
export * from './types';
export * from './constants';

export { runSimulation } from './core/engine';
export {
  simulate,
  riskLevelFor,
  computeKeyFactors,
  effectiveFavorability,
} from './core/simulator';
export type { SimulateInput, SimulateStats } from './core/simulator';
export { normalizeFactors, clampScore } from './core/weights';
export { parseScenario, sanitizeScenario, keywordFactors } from './core/parser';
export {
  TEMPLATES,
  GENERIC_TEMPLATE,
  matchTemplate,
  getTemplateByName,
  listTemplateNames,
} from './templates';
export type { DecisionTemplate } from './templates';
