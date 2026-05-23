/**
 * High-level pipeline that ties together layer resolution, loading,
 * merging, and optional redaction into a single call.
 */

const { getActiveLayers } = require('./layers');
const { loadEnv, applyEnv } = require('./loader');
const { mergeLayers, mergeSafe } = require('./merge');
const { redactEnv } = require('./redact');

/**
 * @typedef {object} PipelineOptions
 * @property {string} [env]            - NODE_ENV override
 * @property {string} [cwd]            - working directory
 * @property {string[]} [layerPatterns] - custom layer patterns
 * @property {boolean} [override]      - if false, won't override existing process.env keys
 * @property {boolean} [redact]        - redact secrets before returning
 * @property {boolean} [apply]         - write merged values into process.env
 */

/**
 * Run the full pour-env pipeline.
 * @param {PipelineOptions} [options]
 * @returns {{ merged: Record<string, string>, sources: Record<string, string>, redacted?: Record<string, string> }}
 */
function run(options = {}) {
  const {
    env,
    cwd,
    layerPatterns,
    override = true,
    redact = false,
    apply = true,
  } = options;

  // 1. Resolve which files exist
  const layerPaths = getActiveLayers({ env, cwd, layerPatterns });

  // 2. Parse each file
  const layers = layerPaths.map((filePath) => ({
    filePath,
    values: loadEnv(filePath),
  }));

  // 3. Merge (with or without override)
  const { merged, sources } = override
    ? mergeLayers(layers)
    : mergeSafe(layers);

  // 4. Optionally apply to process.env
  if (apply) {
    applyEnv(merged, override);
  }

  // 5. Optionally redact secrets in the returned object
  const result = { merged, sources };
  if (redact) {
    result.redacted = redactEnv(merged);
  }

  return result;
}

module.exports = { run };
