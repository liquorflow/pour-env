import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { saveProfile } from './profile.js';
import { applyProfile, switchProfile } from './profile-apply.js';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pour-profile-apply-'));
}

describe('applyProfile', () => {
  let tmp;
  beforeEach(() => {
    tmp = makeTmpDir();
    vi.stubEnv('NODE_ENV', undefined);
    vi.stubEnv('PORT', undefined);
    vi.stubEnv('ONLY_IN_OLD', undefined);
  });
  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
    vi.unstubAllEnvs();
  });

  it('applies profile env vars to process.env', () => {
    saveProfile('dev', { NODE_ENV: 'development', PORT: '3000' }, tmp);
    applyProfile('dev', { base: tmp });
    expect(process.env.NODE_ENV).toBe('development');
    expect(process.env.PORT).toBe('3000');
  });

  it('throws for missing profile', () => {
    expect(() => applyProfile('missing', { base: tmp })).toThrow('does not exist');
  });

  it('merges with existing env safely by default', () => {
    process.env.PORT = '9999';
    saveProfile('dev', { PORT: '3000', NODE_ENV: 'development' }, tmp);
    const result = applyProfile('dev', { base: tmp, existing: { PORT: '9999' } });
    // safe merge: existing wins
    expect(result.PORT).toBe('9999');
  });

  it('override mode lets profile win', () => {
    saveProfile('dev', { PORT: '3000' }, tmp);
    const result = applyProfile('dev', { base: tmp, existing: { PORT: '9999' }, override: true });
    expect(result.PORT).toBe('3000');
  });
});

describe('switchProfile', () => {
  let tmp;
  beforeEach(() => { tmp = makeTmpDir(); });
  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
    vi.unstubAllEnvs();
  });

  it('removes old-only keys and applies new profile', () => {
    saveProfile('old', { ONLY_IN_OLD: 'yes', SHARED: 'old-val' }, tmp);
    saveProfile('new', { SHARED: 'new-val', ONLY_IN_NEW: 'yes' }, tmp);
    process.env.ONLY_IN_OLD = 'yes';
    switchProfile('old', 'new', { base: tmp });
    expect(process.env.ONLY_IN_OLD).toBeUndefined();
    expect(process.env.SHARED).toBe('new-val');
    expect(process.env.ONLY_IN_NEW).toBe('yes');
  });
});
