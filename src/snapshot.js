import fs from 'fs';
import path from 'path';

/**
 * Save a snapshot of the current env state to a file.
 * @param {object} env - key/value env object
 * @param {string} snapshotPath - file path to write snapshot
 * @param {object} [meta] - optional metadata (timestamp, label, etc.)
 */
export function saveSnapshot(env, snapshotPath, meta = {}) {
  const snapshot = {
    timestamp: new Date().toISOString(),
    ...meta,
    env,
  };
  fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf8');
  return snapshot;
}

/**
 * Load a previously saved snapshot from a file.
 * @param {string} snapshotPath
 * @returns {{ timestamp: string, env: object, [key: string]: any }}
 */
export function loadSnapshot(snapshotPath) {
  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`Snapshot not found: ${snapshotPath}`);
  }
  const raw = fs.readFileSync(snapshotPath, 'utf8');
  return JSON.parse(raw);
}

/**
 * Diff two env objects, returning added, removed, and changed keys.
 * @param {object} before
 * @param {object} after
 */
export function diffEnv(before, after) {
  const added = {};
  const removed = {};
  const changed = {};

  for (const key of Object.keys(after)) {
    if (!(key in before)) {
      added[key] = after[key];
    } else if (before[key] !== after[key]) {
      changed[key] = { before: before[key], after: after[key] };
    }
  }

  for (const key of Object.keys(before)) {
    if (!(key in after)) {
      removed[key] = before[key];
    }
  }

  return { added, removed, changed };
}

/**
 * List snapshot files in a directory, sorted newest first.
 * @param {string} dir
 * @returns {string[]}
 */
export function listSnapshots(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(dir, f))
    .sort()
    .reverse();
}
