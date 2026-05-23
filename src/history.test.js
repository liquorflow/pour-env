import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { recordHistory, getHistory, diffLastTwo } from './history.js';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pour-env-hist-'));
}

describe('recordHistory', () => {
  it('writes a snapshot file into the history dir', () => {
    const dir = makeTmpDir();
    const snap = recordHistory({ FOO: 'bar' }, { dir, label: 'initial' });
    assert.equal(snap.env.FOO, 'bar');
    assert.equal(snap.label, 'initial');
    assert.ok(snap.timestamp);
    const files = fs.readdirSync(dir);
    assert.equal(files.length, 1);
  });
});

describe('getHistory', () => {
  it('returns entries newest first', async () => {
    const dir = makeTmpDir();
    recordHistory({ V: '1' }, { dir });
    await new Promise((r) => setTimeout(r, 5));
    recordHistory({ V: '2' }, { dir });
    const hist = getHistory({ dir });
    assert.equal(hist.length, 2);
    assert.equal(hist[0].env.V, '2');
    assert.equal(hist[1].env.V, '1');
  });

  it('respects limit option', async () => {
    const dir = makeTmpDir();
    for (let i = 0; i < 5; i++) {
      recordHistory({ I: String(i) }, { dir });
      await new Promise((r) => setTimeout(r, 3));
    }
    const hist = getHistory({ dir, limit: 3 });
    assert.equal(hist.length, 3);
  });

  it('returns empty array when no history', () => {
    const dir = makeTmpDir();
    assert.deepEqual(getHistory({ dir }), []);
  });
});

describe('diffLastTwo', () => {
  it('returns null with fewer than 2 entries', () => {
    const dir = makeTmpDir();
    recordHistory({ A: '1' }, { dir });
    assert.equal(diffLastTwo({ dir }), null);
  });

  it('diffs the two most recent snapshots', async () => {
    const dir = makeTmpDir();
    recordHistory({ A: '1', B: '2' }, { dir });
    await new Promise((r) => setTimeout(r, 5));
    recordHistory({ A: '1', B: '3', C: 'new' }, { dir });
    const diff = diffLastTwo({ dir });
    assert.deepEqual(diff.added, { C: 'new' });
    assert.deepEqual(diff.changed, { B: { before: '2', after: '3' } });
    assert.deepEqual(diff.removed, {});
  });
});
