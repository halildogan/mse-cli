/**
 * Core domain types for the Micro Simulation Engine.
 *
 * These types are the contract between the parser/weights layer (which produces
 * factors) and the simulator (which consumes them). They are deliberately free
 * of any I/O or framework concerns.
 */

/** How a factor set was derived. */
export type FactorSource = 'template' | 'keyword' | 'ai';

/** A single decision factor fed into the Monte Carlo engine. */
export interface Factor {
  /** Human-readable factor name, e.g. "Client acquisition". */
  name: string;
  /**
   * Strength / level of this factor in the scenario, `s ∈ (0,1)`.
   * Combined with {@link Factor.direction} to yield the *effective favorability*:
   *   - direction `+1` → `s`     (more of it = better for success)
   *   - direction `-1` → `1 - s` (more of it = worse for success)
   */
  score: number;
  /**
   * Importance weight, `w ∈ [0,1]`.
   * Normalized across the set so the weights sum to 1.
   */
  weight: number;
  /**
   * `+1` = tailwind (supports success).
   * `-1` = headwind / risk (the sampled favorability is inverted).
   */
  direction: 1 | -1;
  /**
   * Beta concentration `κ ≥ 1`. Higher = more confident in `score`
   * (a tighter distribution around it).
   */
  concentration: number;
  /** Optional reasoning (AI mode only); surfaced with `--explain`. */
  reasoning?: string;
}

/** A loosely-specified factor as produced by a template, keyword analysis, or AI. */
export interface RawFactor {
  name: string;
  /** Strength / level of this factor (0..1). See {@link Factor.score}. */
  score: number;
  /** Optional importance; normalized later. Uniform weighting is used if omitted. */
  weight?: number;
  /** `+1` tailwind (default) or `-1` headwind. */
  direction?: 1 | -1;
  /** Optional Beta concentration; a default is applied when omitted. */
  concentration?: number;
  /** Optional reasoning (AI mode). */
  reasoning?: string;
}

/** A normalized collection of factors describing a decision scenario. */
export interface FactorSet {
  scenario: string;
  source: FactorSource;
  /** Present when `source === 'template'`. */
  templateName?: string;
  factors: Factor[];
}

/** The raw output of the parsing / extraction step, before weight normalization. */
export interface ParsedScenario {
  scenario: string;
  source: FactorSource;
  /** Present when `source === 'template'`. */
  templateName?: string;
  /** Optional one-line overview (AI mode). */
  summary?: string;
  factors: RawFactor[];
}

/** Qualitative band derived from the success probability. */
export type RiskLevel =
  | 'Highly Favorable'
  | 'Favorable'
  | 'Uncertain'
  | 'Risky'
  | 'Highly Risky';

/** Whether a factor pushes toward success or away from it. */
export type FactorEffect = 'tailwind' | 'headwind';

/** A factor ranked by its influence on the outcome. */
export interface KeyFactor {
  name: string;
  /** Influence = `weight × |effectiveFavorability − 0.5|`. */
  influence: number;
  effect: FactorEffect;
}

/** The full result of a simulation. */
export interface SimulationResult {
  scenario: string;
  runs: number;
  /** The seed used, or `null` when the run was non-deterministic. */
  seed: number | null;
  /** Monte Carlo estimate: `successes / runs ∈ [0,1]`. */
  successProbability: number;
  /** Mean per-run success likelihood (a smoother central estimate). */
  meanLikelihood: number;
  /** 90% credible interval `[p5, p95]` of the per-run likelihood. */
  ci90: [number, number];
  /** Standard deviation of the per-run likelihood. */
  stdev: number;
  riskLevel: RiskLevel;
  /** Factors sorted by descending influence. */
  keyFactors: KeyFactor[];
  source: FactorSource;
  /** Present when `source === 'template'`. */
  templateName?: string;
  /** Optional reasoning lines (AI `--explain`). */
  explain?: string[];
}

/** Options that drive a single engine invocation. */
export interface EngineOptions {
  scenario: string;
  runs: number;
  seed: number | null;
  /** When true, use AI extraction; otherwise rule-based. */
  useAi: boolean;
  /** Force a specific template by name (rule-based mode). */
  template?: string;
  /** Include reasoning lines in the result. */
  explain: boolean;
  /** Resolved OpenAI API key (AI mode only). */
  apiKey?: string;
  /** OpenAI model override (AI mode only). */
  model?: string;
}

/** Persisted local configuration (`~/.mse/config.json`). */
export interface MseConfig {
  version: 1;
  openai?: {
    apiKey?: string;
    model?: string;
  };
  defaults?: {
    runs?: number;
  };
}
