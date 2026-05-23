import { loadProfile, profileExists } from './profile.js';
import { applyEnv } from './loader.js';
import { mergeSafe } from './merge.js';

/**
 * Apply a named profile's env vars to the current process,
 * optionally merging with an existing env object.
 */
export function applyProfile(name, options = {}) {
  const { base = process.cwd(), override = false, existing = {} } = options;

  if (!profileExists(name, base)) {
    throw new Error(`Profile "${name}" does not exist`);
  }

  const profileEnv = loadProfile(name, base);

  const merged = override
    ? { ...existing, ...profileEnv }
    : mergeSafe(existing, profileEnv);

  applyEnv(merged);
  return merged;
}

/**
 * Switch from one profile to another — clears keys from current
 * profile that aren't in the next, then applies the next profile.
 */
export function switchProfile(fromName, toName, options = {}) {
  const { base = process.cwd() } = options;

  let fromEnv = {};
  if (fromName && profileExists(fromName, base)) {
    fromEnv = loadProfile(fromName, base);
  }

  const toEnv = loadProfile(toName, base);

  // Remove keys that belong only to the old profile
  for (const key of Object.keys(fromEnv)) {
    if (!(key in toEnv)) {
      delete process.env[key];
    }
  }

  applyEnv(toEnv);
  return toEnv;
}
