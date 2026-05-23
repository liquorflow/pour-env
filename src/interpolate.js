/**
 * interpolate.js
 * Supports variable interpolation within .env values using ${VAR} syntax.
 */

/**
 * Interpolate a single string value against a context of known variables.
 * Supports ${VAR} and $VAR syntax. Unknown vars are left as-is.
 *
 * @param {string} value - The raw string value to interpolate
 * @param {Record<string, string>} context - Available variables to expand
 * @returns {string}
 */
function interpolateValue(value, context) {
  if (typeof value !== 'string') return value;

  // Handle ${VAR_NAME} syntax
  let result = value.replace(/\$\{([A-Z_][A-Z0-9_]*)\}/gi, (match, key) => {
    return Object.prototype.hasOwnProperty.call(context, key) ? context[key] : match;
  });

  // Handle $VAR_NAME syntax (not followed by another word char)
  result = result.replace(/\$([A-Z_][A-Z0-9_]*)(?![A-Z0-9_])/gi, (match, key) => {
    return Object.prototype.hasOwnProperty.call(context, key) ? context[key] : match;
  });

  return result;
}

/**
 * Interpolate all values in an env object.
 * Variables are resolved in order, so later entries can reference earlier ones.
 *
 * @param {Record<string, string>} env - The flat env object to process
 * @returns {Record<string, string>}
 */
function interpolateEnv(env) {
  const result = {};
  const context = { ...process.env };

  for (const [key, value] of Object.entries(env)) {
    const interpolated = interpolateValue(value, { ...context, ...result });
    result[key] = interpolated;
    context[key] = interpolated;
  }

  return result;
}

/**
 * Check whether a string contains any interpolation tokens.
 *
 * @param {string} value
 * @returns {boolean}
 */
function hasInterpolation(value) {
  return /\$\{[A-Z_][A-Z0-9_]*\}|\$[A-Z_][A-Z0-9_]*/i.test(value);
}

module.exports = { interpolateValue, interpolateEnv, hasInterpolation };
