import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { diffEnvObjects, formatDiff, diffAgainstSnapshot } from './diff.js';
import { saveSnapshot } from './snapshot.js';

function makeTmpDir() {
  return mkdtempSync(join(tmpdir(), 'pour-env-diff-'));
}

describe('diffEnvObjects', () => {
  it('detects added keys', () => {
    const result = diffEnvObjects({ A: '1' }, { A: '1', B: '2' });
    assert.deepEqual(result.added, ['B']);
    assert.deepEqual(result.removed, []);
    assert.deepEqual(result.changed, []);
  });

  it('detects removed keys', () => {
    const result = diffEnvObjects({ A: '1', B: '2' }, { A: '1' });
    assert.deepEqual(result.removed, ['B']);
    assert.deepEqual(result.added, []);
  });

  it('detects changed keys', () => {
    const result = diffEnvObjects({ A: '1' }, { A: '2' });
    assert.equal(result.changed.length, 1);
    assert.equal(result.changed[0].key, 'A');
    assert.equal(result.changed[0].from, '1');
    assert.equal(result.changed[0].to, '2');
  });

  it('returns empty diff for identical envs', () => {
    const result = diffEnvObjects({ X: 'hello' }, { X: 'hello' });
    assert.deepEqual(result, { added: [], removed: [], changed: [] });
  });
});

describe('formatDiff', () => {
  it('formats added, removed, changed lines', () => {
    const diff = { added: ['NEW'], removed: ['OLD'], changed: [{ key: 'K', from: 'a', to: 'b' }] };
    const out = formatDiff(diff);
    assert.ok(out.includes('+ NEW'));
    assert.ok(out.includes('- OLD'));
    assert.ok(out.includes('~ K: a → b'));
  });

  it('redacts changed values when option set', () => {
    const diff = { added: [], removed: [], changed: [{ key: 'SECRET', from: 'x', to: 'y' }] };
    const out = formatDiff(diff, { redact: true });
    assert.ok(out.includes('***'));
    assert.ok(!out.includes('x'));
  });

  it('returns (no changes) for empty diff', () => {
    assert.equal(formatDiff({ added: [], removed: [], changed: [] }), '(no changes)');
  });
});

describe('diffAgainstSnapshot', () => {
  let dir;
  before(() => { dir = makeTmpDir(); });
  after(() => rmSync(dir, { recursive: true, force: true }));

  it('diffs current env against a saved snapshot', () => {
    saveSnapshot('base', { DB: 'postgres', PORT: '5432' }, dir);
    const current = { DB: 'mysql', PORT: '5432', NEW_KEY: 'yes' };
    const result = diffAgainstSnapshot('base', current, dir);
    assert.deepEqual(result.added, ['NEW_KEY']);
    assert.equal(result.changed[0].key, 'DB');
    assert.deepEqual(result.removed, []);
  });
});
