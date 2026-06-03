# 🧠 Micro Simulation Engine (`mse-cli`)

> A scientific command-line tool for modeling uncertainty in human decisions using **Monte Carlo simulation**, with **optional** AI-assisted factor extraction.

`mse` turns a plain-language decision — *"start freelancing as a developer"* — into a probabilistic forecast: a success probability, a risk band, a credible interval, and the factors that move the needle. It is a **modeling instrument**, not a chatbot or a prediction oracle. The math is transparent, reproducible, and runs entirely on your machine.

```bash
$ mse "start freelancing as a developer" --seed 42

Simulation Result
-----------------
Scenario: start freelancing as a developer

Success Probability: 52.20%
█████████████░░░░░░░░░░░
Risk Level: Uncertain  (90% CI 34.3%–70.1%)
Runs: 1000 · Seed: 42 · Factors: template (freelancing)

Key Factors:
  ▲ Skill & portfolio (tailwind)
  ▼ Market competition (headwind)
  ▲ Client acquisition (tailwind)
  ▼ Income stability (headwind)
  ▲ Financial runway (tailwind)
```

---

## Demo

![mse-cli in action — simulating decisions and inspecting stored config](assets/demo.svg)

<sub>Regenerate the recording with `npm run demo` (builds, captures real CLI output into `assets/demo.cast`, and renders `assets/demo.svg`). To record your own session instead, use `scripts/demo.sh` with asciinema.</sub>

## Why it exists

Most "should I do X?" tools either give you a vibe ("looks good! 🚀") or a single confident number that hides all its assumptions. Real decisions are driven by **multiple uncertain factors** interacting, and the honest output is a **distribution**, not a verdict.

`mse` makes the uncertainty explicit:

- It decomposes a decision into weighted **factors**.
- It treats each factor as a **random variable**, not a fixed value.
- It runs thousands of simulated trials and reports the **spread** of outcomes.
- It keeps the AI strictly in an advisory role — the AI may *suggest* factors, but it **never** computes the probability.

The result is a tool that feels like a scientific instrument for reasoning about uncertainty.

---

## Features

- 🎲 **Monte Carlo engine** — Weighted Beta sampling + logistic aggregation, thousands of trials per run.
- 🔁 **Reproducible** — `--seed` makes any run deterministic, bit-for-bit.
- 🧩 **Works offline** — Rule-based factor extraction via a built-in template library + keyword fallback. No account required.
- 🤖 **Optional AI** — `--ai openai` uses OpenAI Structured Outputs to extract factors. Entirely opt-in.
- 🔐 **Safe key handling** — API key resolved from flag → env → local config; stored at `chmod 600`; never logged.
- 📊 **Human or JSON** — Pretty terminal output, or `--json` for piping into other tools.
- 📦 **Zero-config** — One binary, sensible defaults, no setup needed for the core engine.

---

## Installation

Requires **Node.js ≥ 18**.

```bash
# Global install
npm install -g mse-cli

# Or run without installing
npx mse-cli "should I switch careers"
```

### From source

```bash
git clone https://github.com/halildogan/mse-cli.git
cd mse-cli
npm install
npm run build
npm link        # makes `mse` available globally
```

---

## Quick start

```bash
# Rule-based (no AI, no key needed)
mse "launch a SaaS startup"

# Reproducible run with more trials
mse "launch a SaaS startup" --runs 5000 --seed 42

# Machine-readable output
mse "should I do a bootcamp" --json

# Force a specific built-in template
mse "my situation" --template freelancing

# AI-assisted factor extraction (optional)
mse init                       # store your OpenAI key once
mse "open a coffee shop" --ai openai --explain

# Manage stored configuration
mse config                     # show key (masked), model, and default runs
mse config set runs 5000       # use 5000 runs by default from now on
mse config set model gpt-4o    # change the default model
mse config clear --key         # remove just the stored API key
mse config clear               # remove all stored config
```

---

## Usage

```
mse [scenario] [options]
mse init [options]
```

### Commands

| Command            | Description                                                              |
| ------------------ | ------------------------------------------------------------------------ |
| `mse "<scenario>"` | Run a simulation for the given decision.                                 |
| `mse init`         | Store your OpenAI API key and default model in `~/.mse/config.json`.     |
| `mse config`       | Inspect (masked) or clear your stored key, model, and default runs.      |

### Options (simulation)

| Flag                | Description                                                       | Default      |
| ------------------- | ----------------------------------------------------------------- | ------------ |
| `--ai <provider>`   | Enable AI-assisted factor extraction (`openai`).                  | _(off)_      |
| `--api-key <key>`   | OpenAI API key override (AI mode only).                           | _(resolved)_ |
| `--model <model>`   | OpenAI model override (AI mode only).                             | `gpt-4o-mini`|
| `--runs <n>`        | Number of Monte Carlo runs.                                       | `1000`       |
| `--seed <n>`        | Integer seed for a deterministic, reproducible run.               | _(random)_   |
| `--template <name>` | Force a built-in template (see list below).                       | _(auto)_     |
| `--json`            | Output machine-readable JSON.                                     | `false`      |
| `--explain`         | Include the factor breakdown / reasoning.                         | `false`      |
| `--no-color`        | Disable colored output.                                           | _(color on)_ |
| `-v, --version`     | Print the version.                                                |              |
| `-h, --help`        | Show help.                                                        |              |

### Exit codes

| Code | Meaning                                  |
| ---- | ---------------------------------------- |
| `0`  | Success                                  |
| `1`  | Runtime error                            |
| `2`  | Usage error (bad arguments)              |
| `3`  | AI requested but no API key was found    |

---

## Output

The `Success Probability` is the fraction of simulated trials that ended in success. The `90% CI` is a credible interval over the per-trial success likelihood — a wide interval means the outcome is sensitive to assumptions. `Key Factors` are ranked by influence and marked as a **▲ tailwind** (pushes toward success) or **▼ headwind** (a risk).

`--json` emits the full result object (probability, mean likelihood, CI, standard deviation, risk level, and ranked factors), suitable for dashboards or further analysis. The API key is **never** part of any output.

---

## How it works

`mse` uses **Weighted Beta Sampling + Logistic Monte Carlo**. Each decision is decomposed into factors, each with:

- **score** `s ∈ (0,1)` — the factor's strength/level,
- **weight** `w ∈ [0,1]` — its importance (normalized so the weights sum to 1),
- **direction** — `+1` tailwind or `-1` headwind,
- **concentration** `κ` — how confident we are in the score.

For each of `N` runs and each factor `i`:

```
fᵢ   = directionᵢ == +1 ? sᵢ : 1 − sᵢ          # effective favorability
xᵢ   ~ Beta(fᵢ·κ, (1−fᵢ)·κ)                    # draw (models factor uncertainty)
agg  = Σ  wᵢ · (xᵢ − 0.5)                       # weighted, neutral-centered
p    = sigmoid(GAIN · agg)                      # per-run success likelihood
outcome ~ Bernoulli(p)                          # models outcome uncertainty
```

The reported **success probability** is the mean outcome across all runs; the **credible interval** and **standard deviation** come from the distribution of `p`. Two sources of randomness are modeled deliberately: *parameter uncertainty* (the Beta draws) and *outcome uncertainty* (the Bernoulli step).

**Determinism:** all randomness is drawn from a single seeded `mulberry32` stream, so the same `seed` + factors + run count always yields identical results.

### Factor extraction

1. **Explicit template** — `--template <name>` forces a built-in preset.
2. **Template match** — the scenario text is matched against built-in templates by keywords.
3. **Keyword fallback** — otherwise, a balanced generic model is adjusted by lightweight positive/negative sentiment cues in the text.
4. **AI** (opt-in) — `--ai openai` asks the model to propose factors.

**Built-in templates:** `startup`, `freelancing`, `career-change`, `relocation`, `investment`, `buy-vs-rent`, and the `generic` fallback. Force one with `--template <name>`. These are heuristic starting points — for a tailored analysis, use `--ai openai`.

---

## AI mode (optional)

AI is **entirely optional**. The core engine is fully functional without it.

```bash
mse init                                   # prompts for your key (input hidden)
mse "open a coffee shop" --ai openai --explain
```

**What the AI does:** extract independent factors, suggest scores/weights/direction, and provide brief reasoning (shown with `--explain`).

**What the AI does _not_ do:** it never computes the probability and never runs the simulation. It only proposes inputs, which the local engine validates, normalizes, and simulates. A misbehaving model cannot produce out-of-range inputs — everything is schema-validated and clamped.

> ⚠️ AI extraction is inherently non-deterministic. `--seed` fixes the *simulation* given a set of factors; it does not fix the AI's factor proposal.

### API key resolution

The key is resolved in this order (first match wins):

1. `--api-key <key>` (one-shot override)
2. `OPENAI_API_KEY` environment variable
3. `~/.mse/config.json` (written by `mse init`)

---

## Security

- 🔒 The API key is **never printed or logged** — a redaction layer scrubs key-like tokens from all output, including errors.
- 🗂️ `~/.mse/config.json` is written with `chmod 600` (owner read/write only) inside a `chmod 700` directory.
- 🚫 The config file lives in your home directory, outside any repo, and `.mse/` is gitignored for good measure.
- 🧼 Scenario input is sanitized (control characters stripped, length-capped). The tool never spawns a shell.

---

## Programmatic API

The engine is also exposed as a library:

```ts
import { runSimulation } from 'mse-cli';

const result = await runSimulation({
  scenario: 'launch a SaaS startup',
  runs: 5000,
  seed: 42,
  useAi: false,
  explain: false,
});

console.log(result.successProbability, result.riskLevel);
```

Importing the library never loads the OpenAI SDK — it is pulled in lazily, and only when `useAi: true`.

---

## Development

```bash
npm install
npm run dev -- "start freelancing" --seed 1   # run from source via tsx
npm run typecheck                              # tsc --noEmit
npm run build                                  # bundle to dist/ via tsup
npm test                                       # vitest
```

### Project structure

```
mse-cli/
├── bin/
│   └── mse.ts              # CLI entry (shebang)
├── src/
│   ├── cli/                # commander wiring + `init`
│   ├── core/               # parser, weights, simulator, engine
│   ├── ai/                 # optional OpenAI provider + schema
│   ├── storage/            # ~/.mse/config.json read/write
│   ├── output/             # human + JSON formatter
│   ├── templates/          # built-in factor presets
│   ├── util/               # rng, errors, redaction
│   ├── constants.ts
│   ├── types.ts
│   └── index.ts            # library entry
├── tests/                  # vitest unit/integration tests
└── .github/workflows/ci.yml
```

---

## License

[MIT](./LICENSE) © The mse-cli authors
