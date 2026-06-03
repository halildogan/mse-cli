# Security Policy

`mse` is a **local command-line tool**. It has no server, stores no data remotely, and makes no network calls at all unless you explicitly opt into AI mode (`--ai openai`). This document explains the threat model honestly — including what we deliberately do **not** try to protect against.

## Supported versions

| Version | Supported |
| ------- | --------- |
| `0.x`   | ✅ latest minor |

Until `1.0.0`, only the latest released `0.x` line receives security fixes.

---

## Threat model

`mse` runs as **you**, on **your** machine, in **your** terminal. The realistic adversaries we design for are:

1. **Accidental secret leakage** — an API key ending up in logs, terminal scrollback, screenshots, CI output, or a committed file.
2. **Other users on a shared machine** reading your stored key off disk.
3. **Supply-chain risk** — a malicious or vulnerable dependency.

We explicitly **do not** defend against:

- A user/process that already has the **same OS account** privileges as you. If an attacker can run code as your user, they can read your environment, your files, and your memory — no local CLI can prevent that.
- Malware/root on your machine.
- A compromised OpenAI account or network MITM beyond standard TLS.

The core simulation engine is **offline and pure** — it performs no I/O, so it has no network or filesystem attack surface at all.

---

## API key handling

Resolution order (first match wins):

1. `--api-key <key>` (one-shot CLI flag)
2. `OPENAI_API_KEY` environment variable
3. `~/.mse/config.json` (written by `mse init`)

Guarantees:

- The key is **never printed and never logged**. A redaction layer (`src/util/redact.ts`) scrubs `sk-…`-style tokens from all output, including error messages and stack traces.
- `--json` output and human output **never** contain the key.
- The key is transmitted **only** to the OpenAI API, over HTTPS, and **only** when you pass `--ai openai`.
- The interactive `mse init` prompt does **not** echo the key to the terminal.

---

## Config file security model (`~/.mse/config.json`)

- The directory `~/.mse` is created with mode **`0700`** (owner-only).
- The file `~/.mse/config.json` is written with mode **`0600`** (owner read/write only), and re-`chmod`ed on every write to correct looser permissions.
- The file lives in your home directory, **outside any repository**. `.mse/` is also gitignored as a backstop.

### No encryption theater (honest security model)

We **store the API key in plaintext** (with `0600` permissions). We intentionally do **not** "encrypt" it at rest, and here's the honest reason:

> A local CLI must be able to read the key automatically on every run, with no human present to supply a passphrase. Any key the program can decrypt unattended, an attacker running as your user can also decrypt unattended. "Encrypting" it would therefore be **obfuscation, not security** — it would add complexity and a false sense of safety without changing the actual threat model.

The real protection for a local secret is **OS file permissions** (`0600`) and your OS account boundary — which is exactly what we use. If you want stronger guarantees, prefer supplying the key via the `OPENAI_API_KEY` environment variable from your own secret manager, or pass `--api-key` from a vault at invocation time, and don't run `mse init` at all.

---

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

- Preferred: open a private [GitHub Security Advisory](https://github.com/halildogan/mse-cli/security/advisories/new).
- Include: affected version, reproduction steps, impact, and any suggested fix.

We aim to acknowledge reports within **72 hours** and to ship a fix or mitigation for confirmed issues as quickly as is responsible, coordinating disclosure with you.

When in scope, please test against a clean install and include the exact CLI command (with any secret redacted).

---

## Secret-scanning expectations

- CI runs **gitleaks** on pushes, PRs, and a weekly schedule (`.github/workflows/security.yml`).
- Never commit a real-looking key. Use obvious placeholders such as `sk-your-key-here` in docs and `.env.example`.
- If a secret is ever committed, treat it as compromised: **rotate it immediately** at the provider, then scrub history. Rotation first — history rewriting does not un-leak a key that was already pushed.

---

## Dependency security

- CI fails on **critical** vulnerabilities (`npm audit --audit-level=critical`) and reports high-and-below informationally.
- Dependabot proposes weekly dependency and GitHub-Actions updates.
- The published npm package ships only `dist/`, `README.md`, and `LICENSE` — no tests, scripts, or config — minimizing what reaches consumers.

---

## Enforced invariants (defense in depth)

These are checked automatically, not just documented:

- `npm run check:core` fails the build if the deterministic core imports the AI layer, the network, `child_process`, storage, or `process.env`.
- `npm run check:determinism` fails the build if a seeded run is not reproducible.
- Secret scanning + dependency audit run in CI.
