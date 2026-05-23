const { resolveLayers, getActiveLayers } = require('./layers');
const { loadEnv, applyEnv } = require('./loader');
const { mergeLayers } = require('./merge');
const { redactEnv } = require('./redact');
const { validateEnv, parseSchema } = require('./validate');

/**
 * Full pipeline: resolve layers → load → merge → validate → redact → apply
 *
 * @param {object} options
 * @param {string}   options.cwd          - working directory
 * @param {string}   options.environment  - e.g. 'production'
 * @param {boolean}  [options.ci]         - enable secret redaction
 * @param {object}   [options.schema]     - validation schema (raw or parsed)
 * @param {boolean}  [options.apply]      - write merged env into process.env
 * @returns {{ env: Record<string,string>, redacted: Record<string,string>, errors: string[] }}
 */
function run({ cwd, environment, ci = false, schema = null, apply = true }) {
  const layers = resolveLayers(cwd, environment);
  const active = getActiveLayers(layers);
  const loaded = active.map((file) => loadEnv(file));
  const env = mergeLayers(loaded);

  let errors = [];
  if (schema) {
    const parsed = typeof Object.values(schema)[0] === 'string'
      ? parseSchema(schema)
      : schema;
    const result = validateEnv(env, parsed);
    errors = result.errors;
    if (!result.valid) {
      const summary = result.errors.join('\n  ');
      throw new Error(`Environment validation failed:\n  ${summary}`);
    }
  }

  const redacted = ci ? redactEnv(env) : env;

  if (apply) {
    applyEnv(env);
  }

  return { env, redacted, errors };
}

module.exports = { run };
