---
name: Feature request
about: Suggest a new capability or improvement
title: 'feat: '
labels: [enhancement, triage]
assignees: ''
---

## Problem / motivation

<!-- What decision-modeling problem are you trying to solve? -->

## Proposed solution

<!-- What would you like mse to do? Include an example CLI invocation. -->

```bash
mse "..." --your-proposed-flag
```

## Which layer would this touch?

- [ ] Core engine (simulation math, sampling, risk model) — **changes here must preserve determinism**
- [ ] AI layer (optional factor extraction)
- [ ] CLI / output
- [ ] Templates (new built-in decision presets)
- [ ] Storage / config

## Determinism & core-safety considerations

> The simulation engine is deterministic and sacred. Everything else is extensible.

- [ ] This feature does **not** require nondeterminism in the core (or it lives entirely outside the core).
- [ ] This feature does **not** require the core engine to call the network or the AI layer.
- [ ] If it involves AI, the AI remains advisory (proposes factors only; never computes the probability).

## Alternatives considered

<!-- Other approaches you thought about. -->

## Additional context

<!-- Mockups, references, prior art, etc. -->
