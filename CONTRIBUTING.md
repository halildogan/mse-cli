# Contributing to mse-cli

Thanks for your interest in contributing! This project has one non-negotiable design principle, and most of the rules below exist to protect it:

> **The simulation engine is deterministic and sacred. Everything else is extensible.**

Please read this whole document before opening a pull request.

---

## Architecture: protected core vs. extensible edges

The codebase is split into a **protected deterministic core** and **extensible everything-else**.

### 🛡️ Protected core (changes require extra scrutiny)

| Path | Responsibility |
| --- | --- |
| `src/core/simulator.ts` | Monte Carlo math, Beta/Bernoulli sampling, statistics |
| `src/core/weights.ts` | Weight normalization, score clamping |
| `src/core/parser.ts` | Rule-based factor extraction |
| `src/templates/**` | Built-in factor presets |
| `src/util/rng.ts` | Seeded PRNG and samplers |
| `src/types.ts`, `src/constants.ts` | Shared contracts and tunables |

Rules for the core:

1. **Deterministic.** For a fixed `(factors, runs, seed)`, output must be identical, byte-for-bit, forever. No `Date.now()`, no wall-clock, no iteration-order dependence, no unseeded randomness (the only `Math.random()` is the explicit no-seed path in `rng.ts`).
2. **Pure & offline.** The core must **never** import the AI layer, perform network I/O, spawn a process, read `process.env`, or touch the filesystem. This is enforced by `npm run check:core`.
3. **No secrets.** The core never sees an API key.

### 🧩 Extensible edges

- `src/ai/**` — optional OpenAI integration. May use the network and the SDK.
- `src/cli/**`, `bin/**`, `src/output/**` — CLI surface and formatting.
- `src/storage/**` — local config (`~/.mse/config.json`).
- `src/core/engine.ts` — the **orchestrator** and the *only* bridge from core to AI. It may load the AI layer **lazily** (`await import('../ai/provider')`) and never statically.

### The AI boundary (hard rule)

AI may **propose factors** (name, score, weight, direction, reasoning). AI must **never**:

- compute the success probability,
- run or influence the Monte Carlo loop,
- be required for the default (rule-based) mode to work.

All AI output is schema-validated (zod) and clamped/normalized before it can reach the simulator.

---

## Development setup

```bash
git clone https://github.com/halildogan/mse-cli.git
cd mse-cli
npm install

npm run dev -- "start freelancing" --seed 1   # run from source
npm run check:core                              # core isolation guard
npm run typecheck                               # tsc --noEmit
npm run build                                   # bundle to dist/
npm test                                        # vitest
npm run check:determinism                       # integration determinism gate (needs build)
npm run verify                                  # everything above, in order
```

---

## Git workflow

We use a `main` / `develop` / `feature/*` model:

- **`main`** — always releasable. Protected. Only updated via reviewed PRs and release tags.
- **`develop`** — integration branch for the next release. Protected.
- **`feature/<short-name>`** — new features; branch off `develop`.
- **`fix/<short-name>`** — bug fixes; branch off `develop` (or `main` for hotfixes).
- **`docs/<short-name>`, `chore/<short-name>`** — non-code changes.

Open PRs against `develop` (hotfixes may target `main`). Keep PRs focused and small.

---

## Commit conventions

This project follows [**Conventional Commits**](https://www.conventionalcommits.org/). The commit/PR title drives changelog generation and the version bump.

```
<type>(optional scope): <description>

[optional body]
[optional footer(s)]
```

**Types:** `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `build`, `ci`, `chore`.

**Suggested scopes:** `core`, `ai`, `cli`, `storage`, `templates`, `output`.

**Breaking changes:** add a `!` and a `BREAKING CHANGE:` footer:

```
feat(core)!: change risk-band thresholds

BREAKING CHANGE: success probabilities near boundaries now map to different
risk levels; downstream consumers of riskLevel should re-check expectations.
```

Examples:

```
feat(templates): add a "relocation" decision template
fix(cli): exit 2 on a non-integer --runs value
docs(security): clarify the config-file permission model
```

---

## Pull request rules

A PR must:

1. Pass the full gate: `npm run verify` (core guard, typecheck, build, tests, determinism).
2. Fill out the PR template completely — including the **deterministic core safety**, **AI isolation**, and **security** checklists.
3. Include tests for the change (and a determinism test if it touches the core).
4. Use a Conventional Commit title.
5. Get review from the right Code Owners (see [`.github/CODEOWNERS`](.github/CODEOWNERS)):
   - Core changes → **core maintainers**.
   - AI changes → **AI maintainers**.
   - Security-sensitive changes → **security**.

PRs that reduce determinism, blur the AI/core boundary, or weaken the security model will be requested-changes regardless of how nice the feature is. If you want to challenge the principle itself, open an **architecture discussion** issue first.

---

## Testing requirements

- **Unit tests** for new logic (vitest, in `tests/`).
- **Determinism tests** when touching the core: assert that the same seed yields identical results.
- **AI tests must be mocked** — never hit the real API in tests. See `tests/ai.test.ts` for the pattern (`vi.mock('openai', …)`).
- **No network in unit tests.**

---

## Security rules (summary)

See [`SECURITY.md`](SECURITY.md) for the full model. In short:

- **Never** log, print, or commit an API key, token, or secret.
- The config file (`~/.mse/config.json`) is local-only and written `chmod 600`.
- Sanitize any user input that reaches the engine; never spawn a shell.
- Run `npm audit --audit-level=critical` before submitting; CI fails on critical vulnerabilities.
- Secret scanning (gitleaks) runs in CI — do not commit example keys that look real; use obvious placeholders like `sk-your-key-here`.

---

## Code of conduct

Be respectful and constructive. Assume good faith. By contributing, you agree your work is licensed under the project's [MIT License](LICENSE).
