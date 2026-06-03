---
name: Bug report
about: Report incorrect behavior, a crash, or a reproducibility problem
title: 'bug: '
labels: [bug, triage]
assignees: ''
---

<!--
  For reproducibility, ALWAYS run with an explicit --seed and include the exact
  command and output. A bug in the deterministic core without a seed is very
  hard to investigate.
-->

## Description

<!-- A clear and concise description of the bug. -->

## Exact CLI command

```bash
# Include --seed so the run is reproducible, e.g.
mse "start freelancing as a developer" --seed 42 --runs 1000 --json
```

## Expected behavior

<!-- What you expected to happen. -->

## Actual behavior

<!-- What actually happened. Paste the full output (redact any API key). -->

```
<output here>
```

## Reproducibility

- [ ] I used an explicit `--seed`.
- [ ] The bug reproduces every time with that seed.
- [ ] I can reproduce it on a clean install (`npm i -g mse-cli`).

## Which layer is affected?

- [ ] Core engine (math / probability / determinism) — **this should never depend on AI or network**
- [ ] AI layer (`--ai openai`)
- [ ] CLI / output formatting
- [ ] Storage / config (`mse init`, `~/.mse/config.json`)
- [ ] Not sure

> If this is a core-engine bug, does it reproduce **without** `--ai`? (The core must be fully functional and deterministic without AI.)
>
> - [ ] Yes, reproduces without `--ai`
> - [ ] Only happens with `--ai`

## Environment

- mse-cli version: <!-- `mse --version` -->
- Node.js version: <!-- `node --version` -->
- OS / terminal:
- Install method: <!-- npm global / npx / from source -->

## Additional context

<!-- Anything else. NEVER paste your API key. -->
