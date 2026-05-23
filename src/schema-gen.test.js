import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { inferType, looksLikeSecret, generateSchema, generateSchemaFromFile, saveSchema } from './schema-gen.js';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pour-env-schema-'));
}

describe('inferType', () => {
  it('detects boolean true/false', () => {
    expect(inferType('true')).toBe('boolean');
    expect(inferType('false')).toBe('boolean');
  });

  it('detects numbers', () => {
    expect(inferType('42')).toBe('number');
    expect(inferType('3.14')).toBe('number');
  });

  it('defaults to string', () => {
    expect(inferType('hello')).toBe('string');
    expect(inferType('')).toBe('string');
  });
});

describe('looksLikeSecret', () => {
  it('flags secret-like keys', () => {
    expect(looksLikeSecret('API_KEY')).toBe(true);
    expect(looksLikeSecret('DB_PASSWORD')).toBe(true);
    expect(looksLikeSecret('AUTH_TOKEN')).toBe(true);
  });

  it('does not flag normal keys', () => {
    expect(looksLikeSecret('PORT')).toBe(false);
    expect(looksLikeSecret('NODE_ENV')).toBe(false);
  });
});

describe('generateSchema', () => {
  it('produces correct schema entries', () => {
    const schema = generateSchema({ PORT: '3000', DEBUG: 'true', API_KEY: 'abc123' });
    expect(schema.PORT.type).toBe('number');
    expect(schema.DEBUG.type).toBe('boolean');
    expect(schema.API_KEY.secret).toBe(true);
    expect(schema.PORT.required).toBe(true);
  });

  it('omits default when value is empty', () => {
    const schema = generateSchema({ EMPTY: '' });
    expect(schema.EMPTY.default).toBeUndefined();
  });
});

describe('generateSchemaFromFile', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it('generates schema from an env file', () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'PORT=8080\nDEBUG=false\nSECRET_KEY=mysecret\n');
    const outFile = path.join(tmpDir, 'schema.json');
    const schema = generateSchemaFromFile(envFile, outFile);
    expect(schema.PORT.type).toBe('number');
    expect(schema.SECRET_KEY.secret).toBe(true);
    expect(fs.existsSync(outFile)).toBe(true);
    const saved = JSON.parse(fs.readFileSync(outFile, 'utf8'));
    expect(saved.DEBUG.type).toBe('boolean');
  });

  it('throws if env file does not exist', () => {
    expect(() => generateSchemaFromFile('/no/such/file', '/tmp/out.json')).toThrow();
  });
});
