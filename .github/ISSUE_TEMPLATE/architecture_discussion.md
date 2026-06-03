---
name: Architecture discussion
about: Propose or debate a design/architecture change (especially anything touching the core)
title: 'arch: '
labels: [architecture, triage]
assignees: ''
---

<!--
  Use this for design-level conversations: changes to the probability model,
  the AI/core boundary, the storage/security model, or public interfaces.
  Implementation PRs that change architecture should reference a discussion here.
-->

## Topic

<!-- One-line summary of the architectural question. -->

## Context & current behavior

<!-- How does it work today? Link to the relevant files (e.g. src/core/simulator.ts). -->

## Proposed change

<!-- What are you proposing, and what problem does it solve? -->

## Impact on the deterministic core

> The simulation engine is deterministic and sacred. Everything else is extensible.

- [ ] This proposal keeps the core deterministic and reproducible under `--seed`.
- [ ] This proposal preserves the rule that the core never imports the AI layer, network, or secrets.
- [ ] If it changes the probability model, it explains the statistical reasoning and the migration impact on existing results.

## Impact on the AI / core separation

- [ ] AI remains optional and advisory (factors only — never computes probability).
- [ ] The default (no-AI) path remains fully functional.

## Backwards compatibility

- [ ] No change to public CLI flags or `--json` output shape.
- [ ] OR: this is a breaking change (describe the migration).

## Alternatives & trade-offs

<!-- Other designs considered and why this one is preferred. -->

## Open questions

<!-- What needs to be decided before implementation can start? -->
