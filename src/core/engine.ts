import type { EngineOptions, Factor, ParsedScenario, SimulationResult } from '../types';
import { normalizeFactors } from './weights';
import { computeKeyFactors, effectiveFavorability, riskLevelFor, simulate } from './simulator';
import { parseScenario } from './parser';

/** Builds the human-readable reasoning lines surfaced by `--explain`. */
function buildExplain(parsed: ParsedScenario, factors: Factor[]): string[] {
  const lines: string[] = [];
  const origin =
    parsed.source === 'template'
      ? `template "${parsed.templateName}"`
      : parsed.source === 'ai'
        ? 'AI-assisted extraction'
        : 'keyword analysis';
  lines.push(`Factors derived via ${origin}.`);
  if (parsed.summary) {
    lines.push(`AI summary: ${parsed.summary}`);
  }

  for (const f of factors) {
    const fav = effectiveFavorability(f);
    const detail =
      `${f.name}: weight ${(f.weight * 100).toFixed(1)}%, ` +
      `favorability ${(fav * 100).toFixed(0)}% (${f.direction === 1 ? 'tailwind' : 'headwind'} input)`;
    lines.push(f.reasoning ? `${detail} - ${f.reasoning}` : detail);
  }
  return lines;
}

/**
 * Resolves the factor set for a scenario. AI extraction is loaded lazily and
 * only when requested, so the rule-based path never imports the OpenAI SDK.
 */
async function resolveFactors(options: EngineOptions): Promise<ParsedScenario> {
  if (options.useAi) {
    const { extractFactorsWithAi } = await import('../ai/provider');
    return extractFactorsWithAi(options);
  }
  return parseScenario(options.scenario, options.template ? { template: options.template } : {});
}

/**
 * End-to-end engine: resolve factors (rule-based or AI) -> normalize weights ->
 * run the Monte Carlo simulation -> assemble a {@link SimulationResult}.
 */
export async function runSimulation(options: EngineOptions): Promise<SimulationResult> {
  const parsed = await resolveFactors(options);
  const factors = normalizeFactors(parsed.factors);
  const stats = simulate({ factors, runs: options.runs, seed: options.seed });
  const keyFactors = computeKeyFactors(factors);

  const result: SimulationResult = {
    scenario: parsed.scenario,
    runs: options.runs,
    seed: options.seed,
    successProbability: stats.successProbability,
    meanLikelihood: stats.meanLikelihood,
    ci90: stats.ci90,
    stdev: stats.stdev,
    riskLevel: riskLevelFor(stats.successProbability),
    keyFactors,
    source: parsed.source,
  };

  if (parsed.templateName) {
    result.templateName = parsed.templateName;
  }
  if (options.explain) {
    result.explain = buildExplain(parsed, factors);
  }
  return result;
}
