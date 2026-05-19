const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

/**
 * Resolves the layered env files to load based on the current NODE_ENV.
 * Priority (highest to lowest):
 *   .env.{NODE_ENV}.local > .env.local > .env.{NODE_ENV} > .env
 *
 * @param {string} [cwd=process.cwd()] - Base directory to look for env files
 * @param {string} [env=process.env.NODE_ENV] - The current environment name
 * @returns {object} - Merged key/value pairs from all resolved env files
 */
function loadEnv(cwd = process.cwd(), env = process.env.NODE_ENV || 'development') {
  const layers = [
    '.env',
    `.env.${env}`,
    '.env.local',
    `.env.${env}.local`,
  ];

  const merged = {};

  for (const filename of layers) {
    const filepath = path.resolve(cwd, filename);

    if (!fs.existsSync(filepath)) {
      continue;
    }

    const result = dotenv.parse(fs.readFileSync(filepath));

    Object.assign(merged, result);
  }

  return merged;
}

/**
 * Loads env vars into process.env using the layered strategy.
 *
 * @param {object} [options={}]
 * @param {string} [options.cwd]
 * @param {string} [options.env]
 * @param {boolean} [options.override=false] - Whether to override existing process.env vars
 */
function applyEnv({ cwd, env, override = false } = {}) {
  const vars = loadEnv(cwd, env);

  for (const [key, value] of Object.entries(vars)) {
    if (override || process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return vars;
}

module.exports = { loadEnv, applyEnv };
