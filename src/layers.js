/**
 * Layer resolution for pour-env.
 * Determines which .env files to load based on the current environment,
 * ordered from lowest to highest priority.
 */

const path = require('path');

const DEFAULT_LAYERS = [
  '.env',
  '.env.local',
  '.env.{NODE_ENV}',
  '.env.{NODE_ENV}.local',
];

/**
 * Resolve layer filenames for a given environment.
 * @param {string} env - e.g. 'development', 'test', 'production'
 * @param {string[]} [layerPatterns] - override default layer patterns
 * @param {string} [cwd] - base directory, defaults to process.cwd()
 * @returns {string[]} absolute paths to env files, in priority order
 */
function resolveLayers(env, layerPatterns = DEFAULT_LAYERS, cwd = process.cwd()) {
  if (!env || typeof env !== 'string') {
    throw new Error('resolveLayers: env must be a non-empty string');
  }

  return layerPatterns.map((pattern) => {
    const filename = pattern.replace('{NODE_ENV}', env);
    return path.resolve(cwd, filename);
  });
}

/**
 * Return only the layer paths that actually exist on disk.
 * @param {string[]} layerPaths
 * @param {object} [fs] - injectable fs module for testing
 * @returns {string[]}
 */
function filterExistingLayers(layerPaths, fs = require('fs')) {
  return layerPaths.filter((p) => {
    try {
      fs.accessSync(p);
      return true;
    } catch {
      return false;
    }
  });
}

/**
 * Get the ordered list of existing env file paths for the current environment.
 * @param {object} [options]
 * @param {string} [options.env]
 * @param {string[]} [options.layerPatterns]
 * @param {string} [options.cwd]
 * @param {object} [options.fs]
 * @returns {string[]}
 */
function getActiveLayers({ env, layerPatterns, cwd, fs } = {}) {
  const resolvedEnv = env || process.env.NODE_ENV || 'development';
  const allLayers = resolveLayers(resolvedEnv, layerPatterns, cwd);
  return filterExistingLayers(allLayers, fs);
}

module.exports = { resolveLayers, filterExistingLayers, getActiveLayers, DEFAULT_LAYERS };
