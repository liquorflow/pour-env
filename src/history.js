import path from 'path';
import { saveSnapshot, loadSnapshot, diffEnv, listSnapshots } from './snapshot.js';

const DEFAULT_HISTORY_DIR = '.pour-env/history';

/**
 * Record an env snapshot into the history directory.
 * @param {object} env
 * @param {object} [options]
 * @param {string} [options.dir]
 * @param {string} [options.label]
 */
export function recordHistory(env, { dir = DEFAULT_HISTORY_DIR, label } = {}) {
  const ts = Date.now();
  const filename = `${ts}.json`;
  const filePath = path.join(dir, filename);
  return saveSnapshot(env, filePath, { label });
}

/**
 * Get the N most recent history entries.
 * @param {object} [options]
 * @param {string} [options.dir]
 * @param {number} [options.limit]
 * @returns {Array<{ timestamp: string, env: object }>}
 */
export function getHistory({ dir = DEFAULT_HISTORY_DIR, limit = 10 } = {}) {
  const files = listSnapshots(dir).slice(0, limit);
  return files.map((f) => loadSnapshot(f));
}

/**
 * Compare the two most recent history entries.
 * Returns null if fewer than 2 entries exist.
 * @param {object} [options]
 * @param {string} [options.dir]
 */
export function diffLastTwo({ dir = DEFAULT_HISTORY_DIR } = {}) {
  const entries = getHistory({ dir, limit: 2 });
  if (entries.length < 2) return null;
  // entries[0] is newest, entries[1] is older
  return diffEnv(entries[1].env, entries[0].env);
}

/**
 * Clear all history entries.
 * @param {object} [options]
 * @param {string} [options.dir]
 */
export function clearHistory({ dir = DEFAULT_HISTORY_DIR } = {}) {
  const files = listSnapshots(dir);
  files.forEach((f) => {
    try { require('fs').unlinkSync(f); } catch (_) {}
  });
  return files.length;
}
