/**
 * Validates environment variables against a schema definition.
 * Schema entries can specify: required, type, pattern, allowedValues
 */

/**
 * @param {Record<string, string>} env
 * @param {Record<string, object>} schema
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateEnv(env, schema) {
  const errors = [];

  for (const [key, rules] of Object.entries(schema)) {
    const value = env[key];

    if (rules.required && (value === undefined || value === '')) {
      errors.push(`Missing required variable: ${key}`);
      continue;
    }

    if (value === undefined) continue;

    if (rules.type) {
      const typeError = checkType(key, value, rules.type);
      if (typeError) errors.push(typeError);
    }

    if (rules.pattern) {
      const re = new RegExp(rules.pattern);
      if (!re.test(value)) {
        errors.push(`${key} does not match pattern ${rules.pattern} (got "${value}")`);
      }
    }

    if (rules.allowedValues && !rules.allowedValues.includes(value)) {
      errors.push(
        `${key} must be one of [${rules.allowedValues.join(', ')}] (got "${value}")`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

function checkType(key, value, type) {
  switch (type) {
    case 'number':
      if (isNaN(Number(value))) return `${key} must be a number (got "${value}")`;
      break;
    case 'boolean':
      if (!['true', 'false', '1', '0'].includes(value.toLowerCase()))
        return `${key} must be a boolean (got "${value}")`;
      break;
    case 'url':
      try {
        new URL(value);
      } catch {
        return `${key} must be a valid URL (got "${value}")`;
      }
      break;
    default:
      break;
  }
  return null;
}

/**
 * Loads a schema from a plain JS object or JSON-compatible structure.
 * @param {object} raw
 * @returns {Record<string, object>}
 */
function parseSchema(raw) {
  const schema = {};
  for (const [key, def] of Object.entries(raw)) {
    schema[key] = typeof def === 'string' ? { required: true, type: def } : def;
  }
  return schema;
}

module.exports = { validateEnv, checkType, parseSchema };
