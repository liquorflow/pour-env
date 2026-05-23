import fs from 'fs';
import path from 'path';

/**
 * Named environment profiles (e.g. "staging", "production", "local")
 * stored as JSON in a profiles directory.
 */

export function getProfilesDir(base = process.cwd()) {
  return path.join(base, '.pour-profiles');
}

export function listProfiles(base = process.cwd()) {
  const dir = getProfilesDir(base);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''));
}

export function saveProfile(name, env, base = process.cwd()) {
  if (!name || typeof name !== 'string') throw new Error('Profile name required');
  const dir = getProfilesDir(base);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify({ name, env, savedAt: new Date().toISOString() }, null, 2));
  return file;
}

export function loadProfile(name, base = process.cwd()) {
  const file = path.join(getProfilesDir(base), `${name}.json`);
  if (!fs.existsSync(file)) throw new Error(`Profile "${name}" not found`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  return data.env;
}

export function deleteProfile(name, base = process.cwd()) {
  const file = path.join(getProfilesDir(base), `${name}.json`);
  if (!fs.existsSync(file)) throw new Error(`Profile "${name}" not found`);
  fs.unlinkSync(file);
  return true;
}

export function profileExists(name, base = process.cwd()) {
  const file = path.join(getProfilesDir(base), `${name}.json`);
  return fs.existsSync(file);
}
