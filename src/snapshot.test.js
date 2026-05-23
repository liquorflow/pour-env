import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { saveSnapshot, loadSnapshot, diffEnv, listSnapshots } from './snapshot.js';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pour-env-snap-'));
}

describe('saveSnapshot / loadSnapshot', () => {
  it('round-trips an env object', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, 'snap.json');
    const env = { FOO: 'bar', PORT: '3000' };
    const saved = saveSnapshot(env, file, { label: 'test' });
    assert.deepEqual(saved.env, env);
    assert.equal(saved.label, 'test');
    assert.ok(saved.timestamp);

    const loaded = loadSnapshot(file);
    assert.deepEqual(loaded.env, env);
    assert.equal(loaded.label, 'test');
  });

  it('throws when snapshot file missing', () => {
    assert.throws(() => loadSnapshot('/tmp/__nonexistent_snap__.json'), /Snapshot not found/);
  });

  it('creates nested directories automatically', () => {
    const dir = makeTmpDir();
    const file = path.join(dir, 'nested', 'deep', 'snap.json');
    saveSnapshot({ A: '1' }, file);
    assert.ok(fs.existsSync(file));
  });
});

describe('diffEnv', () => {
  it('detects added keys', () => {
    const diff = diffEnv({ A: '1' }, { A: '1', B: '2' });
    assert.deepEqual(diff.added, { B: '2' });
    assert.deepEqual(diff.removed, {});
    assert.deepEqual(diff.changed, {});
  });

  it('detects removed keys', () => {
    const diff = diffEnv({ A: '1', B: '2' }, { A: '1' });
    assert.deepEqual(diff.removed, { B: '2' });
  });

  it('detects changed values', () => {
    const diff = diffEnv({ A: '1' }, { A: '2' });
    assert.deepEqual(diff.changed, { A: { before: '1', after: '2' } });
  });

  it('returns empty diff for identical envs', () => {
    const diff = diffEnv({ X: 'y' }, { X: 'y' });
    assert.deepEqual(diff, { added: {}, removed: {}, changed: {} });
  });
});

describe('listSnapshots', () => {
  it('returns empty array when dir missing', () => {
    assert.deepEqual(listSnapshots('/tmp/__no_such_dir_pour_env__'), []);
  });

  it('lists json files sorted newest first', () => {
    const dir = makeTmpDir();
    saveSnapshot({ A: '1' }, path.join(dir, 'a.json'));
    saveSnapshot({ B: '2' }, path.join(dir, 'b.json'));
    const snaps = listSnapshots(dir);
    assert.equal(snaps.length, 2);
    assert.ok(snaps[0].endsWith('b.json'));
  });
});
