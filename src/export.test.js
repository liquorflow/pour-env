import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { serializeEnv, exportEnv } from './export.js';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pour-env-export-'));
}

describe('serializeEnv', () => {
  it('serializes simple key=value pairs', () => {
    const result = serializeEnv({ FOO: 'bar', BAZ: 'qux' });
    expect(result).toContain('FOO=bar');
    expect(result).toContain('BAZ=qux');
  });

  it('quotes values with spaces', () => {
    const result = serializeEnv({ GREETING: 'hello world' });
    expect(result).toContain('GREETING="hello world"');
  });

  it('quotes empty string values', () => {
    const result = serializeEnv({ EMPTY: '' });
    expect(result).toContain('EMPTY=""');
  });

  it('escapes double quotes inside values', () => {
    const result = serializeEnv({ MSG: 'say "hi"' });
    expect(result).toContain('MSG="say \\"hi\\""');
  });

  it('quotes values with hash characters', () => {
    const result = serializeEnv({ TAG: 'v1.0#release' });
    expect(result).toContain('TAG="v1.0#release"');
  });

  it('ends output with a newline', () => {
    const result = serializeEnv({ A: '1' });
    expect(result.endsWith('\n')).toBe(true);
  });
});

describe('exportEnv', () => {
  let tmpDir;

  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true }); });

  it('writes dotenv format by default', () => {
    const out = path.join(tmpDir, '.env.out');
    exportEnv({ KEY: 'value' }, out);
    const content = fs.readFileSync(out, 'utf8');
    expect(content).toContain('KEY=value');
  });

  it('writes json format when specified', () => {
    const out = path.join(tmpDir, 'env.json');
    exportEnv({ KEY: 'value' }, out, { format: 'json' });
    const parsed = JSON.parse(fs.readFileSync(out, 'utf8'));
    expect(parsed.KEY).toBe('value');
  });

  it('throws if file exists and overwrite is false', () => {
    const out = path.join(tmpDir, '.env.out');
    fs.writeFileSync(out, 'existing');
    expect(() => exportEnv({ KEY: 'value' }, out)).toThrow('already exists');
  });

  it('overwrites file when overwrite is true', () => {
    const out = path.join(tmpDir, '.env.out');
    fs.writeFileSync(out, 'OLD=true\n');
    exportEnv({ NEW: 'true' }, out, { overwrite: true });
    const content = fs.readFileSync(out, 'utf8');
    expect(content).toContain('NEW=true');
    expect(content).not.toContain('OLD');
  });

  it('creates nested directories if needed', () => {
    const out = path.join(tmpDir, 'nested', 'deep', '.env');
    exportEnv({ X: '1' }, out);
    expect(fs.existsSync(out)).toBe(true);
  });
});
