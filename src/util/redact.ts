/**
 * Secret redaction helpers. Used everywhere user-facing or log output is
 * produced, so an API key can never leak into the terminal or a log file.
 */

// Matches OpenAI-style keys (sk-..., sk-proj-...) and similar prefixed tokens.
const KEY_PATTERN = /\b(sk|rk|pk)-[A-Za-z0-9_-]{6,}\b/g;

/** Replaces anything resembling an API key with a masked marker. */
export function redact(input: string): string {
  return input.replace(KEY_PATTERN, (match) => `${match.slice(0, 3)}***redacted***`);
}

/**
 * Redacts a known secret value (exact match) wherever it appears, then applies
 * pattern-based redaction as a backstop.
 */
export function redactValue(input: string, secret?: string): string {
  let out = input;
  if (secret && secret.length >= 4) {
    out = out.split(secret).join('***redacted***');
  }
  return redact(out);
}

/** Masks a key for safe display, e.g. `sk-ab…wxyz`. Never reveals the middle. */
export function maskKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '***';
  return `${trimmed.slice(0, 5)}…${trimmed.slice(-4)}`;
}
