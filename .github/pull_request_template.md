<!--
  Thank you for contributing to mse-cli!
  Core principle: "The simulation engine is deterministic and sacred.
  Everything else is extensible." PRs that weaken determinism or blur the
  AI/core boundary will be sent back. Fill out every section.
-->

## Summary

<!-- What does this PR do, and why? -->

## Type of change

- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change
- [ ] Documentation / chore / CI

## Area

- [ ] Core engine (`src/core`, `src/templates`, `src/util/rng.ts`) — **protected**
- [ ] AI layer (`src/ai`)
- [ ] CLI / output (`src/cli`, `bin`, `src/output`)
- [ ] Storage (`src/storage`)
- [ ] Docs / CI / tooling

---

## Deterministic core safety

> The simulation math must remain pure and reproducible.

- [ ] The core engine still has **no** imports of the AI layer, network, `child_process`, or `process.env` (`npm run check:core` passes).
- [ ] Any change touching `src/core` keeps `simulate()` deterministic for a fixed `(factors, runs, seed)`.
- [ ] `npm run check:determinism` passes (same seed → identical output; different seeds → different output).
- [ ] No new source of nondeterminism (e.g. `Date.now()`, unseeded `Math.random()` outside the no-seed path, map/iteration-order dependence) was introduced into the core.

## AI isolation rules

> AI may only **propose factors**. It must never compute probability or run the simulation.

- [ ] The AI layer is only reached via the engine's **lazy** `import('../ai/provider')` — no static AI import in the core.
- [ ] AI output is schema-validated (zod) and clamped/normalized before it reaches the simulator.
- [ ] No AI/network code path is required for the rule-based (default) mode to work.

## Tests

- [ ] Added/updated unit tests for the change.
- [ ] Determinism is covered by a test where relevant.
- [ ] AI changes are tested with a **mocked** client (no real network call).
- [ ] `npm test` passes locally.

## Security review

- [ ] No API key, secret, or token is logged, printed, or committed.
- [ ] Config remains local-only (`~/.mse/config.json`, `chmod 600`); no secret is sent anywhere except the OpenAI API in AI mode.
- [ ] User input that reaches the engine is sanitized; no shell is spawned.
- [ ] `npm audit --audit-level=critical` is clean.

## Breaking changes

- [ ] This PR introduces **no** breaking changes.
- [ ] If it does, I have labeled it `breaking-change`, bumped the major version expectation, and documented the migration below.

<!-- Migration notes (required for breaking changes): -->

## Checklist

- [ ] Conventional Commit title (e.g. `feat:`, `fix:`, `docs:`).
- [ ] I read [CONTRIBUTING.md](../CONTRIBUTING.md) and [SECURITY.md](../SECURITY.md).
