/**
 * Secret redaction utilities for CI pipeline output.
 * Masks sensitive env values based on key patterns or explicit lists.
 */

const DEFAULT_SECRET_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api_key/i,
  /private_key/i,
  /auth/i,
  /credential/i,
];

const REDACTED = '[REDACTED]';

/**
 * Determines if a key should be treated as a secret.
 * @param {string} key
 * @param {RegExp[]} patterns
 * @returns {boolean}
 */
function isSecret(key, patterns = DEFAULT_SECRET_PATTERNS) {
  return patterns.some((pattern) => pattern.test(key));
}

/**
 * Redacts sensitive values in an env object.
 * @param {Record<string, string>} env
 * @param {object} options
 * @param {string[]} [options.additionalKeys] - explicit keys to always redact
 * @param {RegExp[]} [options.patterns] - override default patterns
 * @returns {Record<string, string>}
 */
function redactEnv(env, options = {}) {
  const { additionalKeys = [], patterns = DEFAULT_SECRET_PATTERNS } = options;
  const additionalSet = new Set(additionalKeys.map((k) => k.toUpperCase()));

  return Object.fromEntries(
    Object.entries(env).map(([key, value]) => {
      const shouldRedact =
        additionalSet.has(key.toUpperCase()) || isSecret(key, patterns);
      return [key, shouldRedact ? REDACTED : value];
    })
  );
}

/**
 * Replaces occurrences of secret values inside a string (e.g. log output).
 * @param {string} text
 * @param {Record<string, string>} env - original (unredacted) env
 * @param {object} options
 * @returns {string}
 */
function redactString(text, env, options = {}) {
  const { additionalKeys = [], patterns = DEFAULT_SECRET_PATTERNS } = options;
  const additionalSet = new Set(additionalKeys.map((k) => k.toUpperCase()));

  let result = text;
  for (const [key, value] of Object.entries(env)) {
    if (!value) continue;
    const shouldRedact =
      additionalSet.has(key.toUpperCase()) || isSecret(key, patterns);
    if (shouldRedact) {
      result = result.split(value).join(REDACTED);
    }
  }
  return result;
}

module.exports = { isSecret, redactEnv, redactString, REDACTED, DEFAULT_SECRET_PATTERNS };
