import { Chalk, type ChalkInstance } from 'chalk';
import type { RiskLevel, SimulationResult } from '../types';

export interface FormatOptions {
  json: boolean;
  color: boolean;
}

function pct2(x: number): string {
  return `${(x * 100).toFixed(2)}%`;
}

function pct1(x: number): string {
  return `${(x * 100).toFixed(1)}%`;
}

function colorForRisk(level: RiskLevel, c: ChalkInstance): (s: string) => string {
  switch (level) {
    case 'Highly Favorable':
    case 'Favorable':
      return (s) => c.green(s);
    case 'Uncertain':
      return (s) => c.yellow(s);
    case 'Risky':
    case 'Highly Risky':
      return (s) => c.red(s);
  }
}

function bar(probability: number, width = 24): string {
  const filled = Math.max(0, Math.min(width, Math.round(probability * width)));
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function formatHuman(result: SimulationResult, c: ChalkInstance): string {
  const paint = colorForRisk(result.riskLevel, c);
  const seedLabel = result.seed === null ? 'random' : String(result.seed);
  const sourceLabel = result.templateName ? `${result.source} (${result.templateName})` : result.source;

  const lines: string[] = [];
  lines.push(c.bold('Simulation Result'));
  lines.push(c.dim('-----------------'));
  lines.push(`${c.bold('Scenario:')} ${result.scenario}`);
  lines.push('');
  lines.push(`${c.bold('Success Probability:')} ${paint(pct2(result.successProbability))}`);
  lines.push(c.dim(bar(result.successProbability)));
  lines.push(
    `${c.bold('Risk Level:')} ${paint(result.riskLevel)}  ${c.dim(
      `(90% CI ${pct1(result.ci90[0])}–${pct1(result.ci90[1])})`,
    )}`,
  );
  lines.push(
    c.dim(`Runs: ${result.runs} · Seed: ${seedLabel} · Factors: ${sourceLabel}`),
  );
  lines.push('');
  lines.push(c.bold('Key Factors:'));
  if (result.keyFactors.length === 0) {
    lines.push(c.dim('  (none)'));
  }
  for (const kf of result.keyFactors) {
    const mark = kf.effect === 'tailwind' ? c.green('▲') : c.red('▼');
    lines.push(`  ${mark} ${kf.name} ${c.dim(`(${kf.effect})`)}`);
  }

  if (result.explain && result.explain.length > 0) {
    lines.push('');
    lines.push(c.bold('Reasoning:'));
    for (const line of result.explain) {
      lines.push(c.dim(`  • ${line}`));
    }
  }

  return lines.join('\n');
}

/** Renders a {@link SimulationResult} as colorized text or JSON. Never includes secrets. */
export function formatResult(result: SimulationResult, options: FormatOptions): string {
  if (options.json) {
    return JSON.stringify(result, null, 2);
  }
  const c = new Chalk(options.color ? {} : { level: 0 });
  return formatHuman(result, c);
}
