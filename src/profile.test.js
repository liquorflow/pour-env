import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  listProfiles,
  saveProfile,
  loadProfile,
  deleteProfile,
  profileExists,
  getProfilesDir,
} from './profile.js';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pour-profile-'));
}

describe('profile', () => {
  let tmp;
  beforeEach(() => { tmp = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmp, { recursive: true, force: true }); });

  it('returns empty list when no profiles dir exists', () => {
    expect(listProfiles(tmp)).toEqual([]);
  });

  it('saves and lists a profile', () => {
    saveProfile('staging', { NODE_ENV: 'staging', PORT: '4000' }, tmp);
    expect(listProfiles(tmp)).toContain('staging');
  });

  it('loads a saved profile', () => {
    const env = { NODE_ENV: 'production', API_KEY: 'abc' };
    saveProfile('prod', env, tmp);
    expect(loadProfile('prod', tmp)).toEqual(env);
  });

  it('throws when loading missing profile', () => {
    expect(() => loadProfile('ghost', tmp)).toThrow('Profile "ghost" not found');
  });

  it('deletes a profile', () => {
    saveProfile('temp', { X: '1' }, tmp);
    expect(profileExists('temp', tmp)).toBe(true);
    deleteProfile('temp', tmp);
    expect(profileExists('temp', tmp)).toBe(false);
  });

  it('throws deleting non-existent profile', () => {
    expect(() => deleteProfile('nope', tmp)).toThrow('Profile "nope" not found');
  });

  it('throws on missing name', () => {
    expect(() => saveProfile('', {}, tmp)).toThrow('Profile name required');
  });

  it('saves multiple profiles and lists all', () => {
    saveProfile('alpha', { A: '1' }, tmp);
    saveProfile('beta', { B: '2' }, tmp);
    const list = listProfiles(tmp);
    expect(list).toContain('alpha');
    expect(list).toContain('beta');
    expect(list.length).toBe(2);
  });
});
