/**
 * Merges multiple parsed env objects together.
 * Later layers override earlier ones (higher index = higher priority).
 * Tracks the source file for each key to aid debugging.
 */

/**
 * Merge an ordered array of { filePath, values } layer objects.
 * @param {Array<{ filePath: string, values: Record<string, string> }>} layers
 * @returns {{ merged: Record<string, string>, sources: Record<string, string> }}
 */
function mergeLayers(layers) {
  if (!Array.isArray(layers)) {
    throw new TypeError('mergeLayers: expected an array of layer objects');
  }

  const merged = {};
  const sources = {};

  for (const layer of layers) {
    if (!layer || typeof layer.values !== 'object') {
      throw new TypeError('mergeLayers: each layer must have a values object');
    }
    if (Array.isArray(layer.values)) {
      throw new TypeError('mergeLayers: layer.values must be a plain object, not an array');
    }
    for (const [key, value] of Object.entries(layer.values)) {
      merged[key] = value;
      sources[key] = layer.filePath || 'unknown';
    }
  }

  return { merged, sources };
}

/**
 * Merge layers but skip keys already present in process.env (non-override mode).
 * @param {Array<{ filePath: string, values: Record<string, string> }>} layers
 * @param {object} [processEnv] - injectable env object, defaults to process.env
 * @returns {{ merged: Record<string, string>, sources: Record<string, string> }}
 */
function mergeSafe(layers, processEnv = process.env) {
  const { merged, sources } = mergeLayers(layers);
  const filtered = {};
  const filteredSources = {};

  for (const [key, value] of Object.entries(merged)) {
    if (!(key in processEnv)) {
      filtered[key] = value;
      filteredSources[key] = sources[key];
    }
  }

  return { merged: filtered, sources: filteredSources };
}

module.exports = { mergeLayers, mergeSafe };
