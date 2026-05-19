const fs = require('fs');
const path = require('path');
const os = require('os');
const { loadEnv, applyEnv } = require('./loader');

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pour-env-'));
}

function writeEnvFile(dir, filename, content) {
  fs.writeFileSync(path.join(dir, filename), content, 'utf8');
}

describe('loadEnv', () => {
  it('returns empty object when no env files exist', () => {
    const dir = makeTmpDir();
    const result = loadEnv(dir, 'test');
    expect(result).toEqual({});
  });

  it('loads variables from .env', () => {
    const dir = makeTmpDir();
    writeEnvFile(dir, '.env', 'BASE_VAR=hello\n');
    const result = loadEnv(dir, 'test');
    expect(result.BASE_VAR).toBe('hello');
  });

  it('higher priority layers override lower ones', () => {
    const dir = makeTmpDir();
    writeEnvFile(dir, '.env', 'KEY=base\n');
    writeEnvFile(dir, '.env.test', 'KEY=test\n');
    writeEnvFile(dir, '.env.local', 'KEY=local\n');
    writeEnvFile(dir, '.env.test.local', 'KEY=test-local\n');

    const result = loadEnv(dir, 'test');
    expect(result.KEY).toBe('test-local');
  });

  it('merges variables across layers', () => {
    const dir = makeTmpDir();
    writeEnvFile(dir, '.env', 'A=1\nB=2\n');
    writeEnvFile(dir, '.env.test', 'C=3\n');

    const result = loadEnv(dir, 'test');
    expect(result).toMatchObject({ A: '1', B: '2', C: '3' });
  });
});

describe('applyEnv', () => {
  it('sets variables on process.env', () => {
    const dir = makeTmpDir();
    writeEnvFile(dir, '.env', 'POUR_TEST_VAR=works\n');
    delete process.env.POUR_TEST_VAR;

    applyEnv({ cwd: dir, env: 'test' });
    expect(process.env.POUR_TEST_VAR).toBe('works');
  });

  it('does not override existing process.env vars by default', () => {
    const dir = makeTmpDir();
    writeEnvFile(dir, '.env', 'POUR_EXISTING=from-file\n');
    process.env.POUR_EXISTING = 'already-set';

    applyEnv({ cwd: dir, env: 'test' });
    expect(process.env.POUR_EXISTING).toBe('already-set');
  });

  it('overrides existing vars when override=true', () => {
    const dir = makeTmpDir();
    writeEnvFile(dir, '.env', 'POUR_OVERRIDE=new-value\n');
    process.env.POUR_OVERRIDE = 'old-value';

    applyEnv({ cwd: dir, env: 'test', override: true });
    expect(process.env.POUR_OVERRIDE).toBe('new-value');
  });
});
