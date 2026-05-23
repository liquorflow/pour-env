import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  createAuditEntry,
  writeAuditLog,
  readAuditLog,
  clearAuditLog,
  auditLoad,
  auditRedact,
  auditExport,
  filterAuditLog,
} from './audit.js';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pour-env-audit-'));
}

describe('audit', () => {
  let tmpDir;
  let logPath;

  before(() => {
    tmpDir = makeTmpDir();
    logPath = path.join(tmpDir, 'audit.log');
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('createAuditEntry returns correct shape', () => {
    const entry = createAuditEntry('load', ['API_KEY'], '.env', false);
    assert.equal(entry.action, 'load');
    assert.deepEqual(entry.keys, ['API_KEY']);
    assert.equal(entry.source, '.env');
    assert.equal(entry.redacted, false);
    assert.ok(entry.timestamp);
  });

  it('createAuditEntry wraps single key in array', () => {
    const entry = createAuditEntry('redact', 'SECRET', null, true);
    assert.deepEqual(entry.keys, ['SECRET']);
  });

  it('writeAuditLog and readAuditLog round-trip', () => {
    const entry = createAuditEntry('load', ['DB_URL'], '.env.local');
    writeAuditLog(entry, logPath);
    const entries = readAuditLog(logPath);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].action, 'load');
    assert.deepEqual(entries[0].keys, ['DB_URL']);
  });

  it('readAuditLog returns empty array when file missing', () => {
    const missing = path.join(tmpDir, 'nope.log');
    assert.deepEqual(readAuditLog(missing), []);
  });

  it('auditLoad writes a load entry', () => {
    clearAuditLog(logPath);
    auditLoad(['PORT', 'HOST'], '.env', logPath);
    const entries = readAuditLog(logPath);
    assert.equal(entries[0].action, 'load');
    assert.equal(entries[0].redacted, false);
  });

  it('auditRedact writes a redact entry with redacted=true', () => {
    clearAuditLog(logPath);
    auditRedact(['API_SECRET'], '.env.production', logPath);
    const entries = readAuditLog(logPath);
    assert.equal(entries[0].action, 'redact');
    assert.equal(entries[0].redacted, true);
  });

  it('auditExport writes an export entry', () => {
    clearAuditLog(logPath);
    auditExport(['NODE_ENV'], '.env', logPath);
    const entries = readAuditLog(logPath);
    assert.equal(entries[0].action, 'export');
  });

  it('filterAuditLog filters by action', () => {
    clearAuditLog(logPath);
    auditLoad(['A'], '.env', logPath);
    auditRedact(['B'], '.env', logPath);
    auditExport(['C'], '.env', logPath);
    const redacted = filterAuditLog(logPath, { action: 'redact' });
    assert.equal(redacted.length, 1);
    assert.equal(redacted[0].action, 'redact');
  });

  it('clearAuditLog empties the file', () => {
    auditLoad(['X'], '.env', logPath);
    clearAuditLog(logPath);
    assert.deepEqual(readAuditLog(logPath), []);
  });
});
