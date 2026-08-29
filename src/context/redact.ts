const REDACTED = "[REDACTED]";

const SECRET_ASSIGNMENT =
  /(\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|passwd|secret|private[_-]?key|credential)\b\s*[=:]\s*)(["']?)([^\s,"';}]+)/gi;

const SECRET_JSON =
  /(["'](?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|passwd|secret|private[_-]?key|credential)["']\s*:\s*["'])([^"']+)(["'])/gi;

const TOKEN_PATTERNS: RegExp[] = [
  /\bsk-[A-Za-z0-9_-]{16,}\b/g,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
];

const PRIVATE_KEY_BLOCK =
  /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z0-9 ]*PRIVATE KEY-----/g;

export interface RedactionResult {
  text: string;
  replacements: number;
}

/**
 * Best-effort inline secret redaction. This complements path-level denial; it
 * is intentionally conservative and never claims to be a DLP system.
 */
export function redactSecrets(input: string): RedactionResult {
  let replacements = 0;
  let text = input.replace(PRIVATE_KEY_BLOCK, () => {
    replacements++;
    return REDACTED;
  });
  text = text.replace(SECRET_JSON, (_match, prefix: string, _secret: string, suffix: string) => {
    replacements++;
    return `${prefix}${REDACTED}${suffix}`;
  });
  text = text.replace(SECRET_ASSIGNMENT, (match, prefix: string, quote: string) => {
    replacements++;
    return `${prefix}${quote}${REDACTED}${quote}`;
  });
  for (const pattern of TOKEN_PATTERNS) {
    text = text.replace(pattern, () => {
      replacements++;
      return REDACTED;
    });
  }
  return { text, replacements };
}
