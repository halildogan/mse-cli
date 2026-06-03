# Releasing & Versioning

`mse-cli` follows [Semantic Versioning 2.0.0](https://semver.org/): `MAJOR.MINOR.PATCH`.

## What bumps which number

Because the **deterministic core is sacred**, changes that alter simulation output are treated as more significant than they might be in other tools.

### MAJOR (`X.0.0`) — breaking

- Removing or renaming a CLI flag, command, or changing its meaning.
- Changing the shape of `--json` output (renamed/removed fields).
- A change to the **probability model or risk bands** that changes results for the same `(scenario, seed, runs)`. Reproducibility across a major line is a feature; breaking it is a major event and must be called out.
- Changing the config file schema in an incompatible way.
- Dropping support for a Node.js version in `engines`.

### MINOR (`0.X.0`) — backwards-compatible additions

- New CLI flags/commands that default to existing behavior.
- New built-in templates.
- New optional fields **added** to `--json` output.
- New AI capabilities that remain opt-in.

### PATCH (`0.0.X`) — backwards-compatible fixes

- Bug fixes that do not change documented behavior.
- Performance, docs, internal refactors, dependency bumps.

> Pre-1.0.0 note: while in `0.x`, we still try to respect the above, but the minor version may carry occasional breaking changes when unavoidable — these are documented in the release notes and labeled `breaking-change`.

### The determinism clause

A bug fix that **corrects** the math is, by definition, a change in output. Prefer to batch such corrections and release them as a **MINOR** (pre-1.0) or **MAJOR** (post-1.0) with an explicit note, rather than slipping them into a PATCH. Never silently change what a given seed produces in a patch release.

---

## Release process

1. **Open a release PR** into `main` from `develop` (or a `release/x.y.z` branch).
2. Bump the version: `npm version <major|minor|patch> --no-git-tag-version`. This updates `package.json`; update the `VERSION` constant if not already in sync (a test enforces they match).
3. Ensure `npm run verify` is green locally and in CI.
4. Get **maintainer approval** on the release PR. Releases that touch the core additionally require **core-maintainer** sign-off (see CODEOWNERS).
5. Merge the release PR into `main`.
6. **Tag and push:**
   ```bash
   git checkout main && git pull
   git tag v$(node -p "require('./package.json').version")
   git push origin --tags
   ```
7. The [`release.yml`](.github/workflows/release.yml) workflow then automatically:
   - runs the full verification gate (core guard, typecheck, build, tests, determinism),
   - publishes to npm **if** `NPM_TOKEN` is configured (with `--provenance --access public`),
   - creates a **GitHub Release** with auto-generated notes and attaches the packed tarball.
8. Merge `main` back into `develop` if they diverged.

### Tagging strategy

- Tags are `vMAJOR.MINOR.PATCH` (e.g. `v0.2.0`) and are the **only** trigger for publishing.
- Tags are immutable — never move or delete a published tag. To fix a bad release, publish a new patch.
- Pre-releases use `v1.2.0-rc.1` style tags (npm dist-tag `next`).

---

## Changelog

- Release notes are **auto-generated** by `gh release create --generate-notes` from the merged PR titles since the last tag — which is exactly why Conventional Commit titles are required.
- For a curated history, maintainers may also keep a `CHANGELOG.md` grouped by `feat` / `fix` / `BREAKING CHANGE`.

---

## Required secrets / setup

- `NPM_TOKEN` — an npm automation/granular token with publish rights (optional; without it the workflow still builds, tests, and creates the GitHub Release, just skips `npm publish`).
- `GITHUB_TOKEN` — provided automatically by GitHub Actions; used to create the release.
- For npm **provenance**, the repo must be public and the workflow keeps `id-token: write` permission (already set).
