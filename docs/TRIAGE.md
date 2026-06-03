# Issue Triage & Labeling

This document defines how issues and pull requests are labeled and moved from **open → triaged → in-progress → done**. Labels are defined in [`.github/labels.yml`](../.github/labels.yml) and synced automatically by the [Sync Labels workflow](../.github/workflows/labels.yml).

## Label system

Labels are grouped into orthogonal dimensions so an item can carry one of each:

| Group | Labels | Meaning |
| --- | --- | --- |
| **Type** | `bug`, `enhancement`, `documentation`, `question` | What kind of work this is |
| **Area** | `core-engine`, `ai-layer`, `cli`, `storage`, `security`, `ci`, `dependencies` | Which part of the system |
| **Status** | `triage`, `needs-info`, `in-progress`, `blocked`, `wontfix` | Where it is in the lifecycle |
| **Priority** | `priority: p0`, `priority: p1`, `priority: p2` | How urgent |
| **Special** | `breaking-change`, `determinism`, `good-first-issue`, `help-wanted` | Cross-cutting flags |

`core-engine`, `determinism`, and `security` are the high-attention labels — anything carrying them gets maintainer eyes before work starts.

## Lifecycle

```
open ──► triaged ──► in-progress ──► in-review ──► done
  │         │
  └─ needs-info (paused until reporter replies)
  └─ wontfix / duplicate (closed)
```

1. **Open.** New issues are auto-labeled `triage` (via the issue templates) plus a `type` label.
2. **Triaged.** A maintainer:
   - confirms reproducibility (bugs must include a `--seed` and exact command),
   - assigns an **area** label,
   - assigns a **priority**,
   - flags `determinism`/`security`/`breaking-change` if relevant,
   - removes `triage`. If information is missing, applies `needs-info` instead and asks the reporter.
3. **In-progress.** When someone starts work, they self-assign and add `in-progress`. Link the PR to the issue (`Closes #123`).
4. **In-review.** The PR is open and going through review (see CODEOWNERS routing).
5. **Done.** The PR merges and closes the issue, or the issue is closed as `wontfix`/duplicate with a reason.

## Priority guide

- **p0** — data-wrong or crash in the core, a security issue, or a broken release. Drop everything.
- **p1** — significant bug or a blocking gap; schedule for the next release.
- **p2** — normal enhancements and minor bugs.

## Automated (bot-like) labeling rules

Some labeling is automated; the rest is manual maintainer judgment.

**Automated:**
- **PR area labels** are applied by path, via [`actions/labeler`](../.github/workflows/labeler.yml) using [`.github/labeler.yml`](../.github/labeler.yml). For example, a PR touching `src/core/**` gets `core-engine`; touching `src/ai/**` gets `ai-layer`; touching `src/storage/**` or `src/util/redact.ts` gets `security`.
- **Initial issue labels** come from the issue templates (`bug`+`triage`, `enhancement`+`triage`, `architecture`+`triage`).
- **Dependency PRs** from Dependabot are labeled `dependencies` (and `ci` for actions updates).
- **Label definitions** are kept in sync with `.github/labels.yml` automatically.

**Manual (maintainer judgment):**
- Priority (`p0`/`p1`/`p2`).
- `determinism` and `breaking-change` flags.
- Promoting `triage` → triaged, and `needs-info` handling.
- `good-first-issue` / `help-wanted` curation.

> Rule of thumb for area routing: if a change touches `src/core`, `src/templates`, or `src/util/rng.ts`, it is **core-engine** and must respect the determinism guarantee — even if it also touches other areas.
