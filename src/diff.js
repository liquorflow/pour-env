import { loadSnapshot } from './snapshot.js';

/**
 * Compare two plain env objects and return added, removed, changed keys.
 * @param {Record<string,string>} base
 * @param {Record<string,string>} next
 * @returns {{ added: string[], removed: string[], changed: Array<{key:string,from:string,to:string}> }}
 */
export function diffEnvObjects(base, next) {
  const baseKeys = new Set(Object.keys(base));
  const nextKeys = new Set(Object.keys(next));

  const added = [...nextKeys].filter((k) => !baseKeys.has(k));
  const removed = [...baseKeys].filter((k) => !nextKeys.has(k));
  const changed = [...baseKeys]
    .filter((k) => nextKeys.has(k) && base[k] !== next[k])
    .map((k) => ({ key: k, from: base[k], to: next[k] }));

  return { added, removed, changed };
}

/**
 * Format a diff result as a human-readable string.
 * @param {{ added: string[], removed: string[], changed: Array<{key:string,from:string,to:string}> }} diff
 * @param {{ redact?: boolean }} opts
 * @returns {string}
 */
export function formatDiff(diff, opts = {}) {
  const lines = [];
  const mask = (v) => (opts.redact ? '***' : v);

  for (const key of diff.added) {
    lines.push(`+ ${key}`);
  }
  for (const key of diff.removed) {
    lines.push(`- ${key}`);
  }
  for (const { key, from, to } of diff.changed) {
    lines.push(`~ ${key}: ${mask(from)} → ${mask(to)}`);
  }

  return lines.length ? lines.join('\n') : '(no changes)';
}

/**
 * Diff current env against a named snapshot.
 * @param {string} name  Snapshot name
 * @param {Record<string,string>} currentEnv
 * @param {string} snapshotDir
 * @returns {{ added: string[], removed: string[], changed: Array<{key:string,from:string,to:string}> }}
 */
export function diffAgainstSnapshot(name, currentEnv, snapshotDir) {
  const snap = loadSnapshot(name, snapshotDir);
  return diffEnvObjects(snap, currentEnv);
}
