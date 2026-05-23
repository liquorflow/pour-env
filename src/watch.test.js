const fs = require('fs');
const os = require('os');
const path = require('path');
const { watchEnv } = require('./watch');

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pour-env-watch-'));
}

function writeEnvFile(dir, name, content) {
  fs.writeFileSync(path.join(dir, name), content, 'utf8');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('watchEnv', () => {
  test('returns a stop function', () => {
    const dir = makeTmpDir();
    writeEnvFile(dir, '.env', 'WATCH_TEST=hello');
    const stop = watchEnv({ cwd: dir, env: 'development', apply: false });
    expect(typeof stop).toBe('function');
    stop();
  });

  test('calls onChange when env file is modified', async () => {
    const dir = makeTmpDir();
    writeEnvFile(dir, '.env', 'RELOAD_KEY=initial');

    const changes = [];
    const stop = watchEnv({
      cwd: dir,
      env: 'development',
      apply: false,
      onChange: (newEnv) => changes.push(newEnv),
    });

    await sleep(100);
    writeEnvFile(dir, '.env', 'RELOAD_KEY=updated');
    await sleep(300);

    stop();
    expect(changes.length).toBeGreaterThanOrEqual(1);
    expect(changes[changes.length - 1].RELOAD_KEY).toBe('updated');
  });

  test('returns no-op stop when no env files exist', () => {
    const dir = makeTmpDir();
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const stop = watchEnv({ cwd: dir, env: 'development', apply: false });
    expect(typeof stop).toBe('function');
    expect(() => stop()).not.toThrow();
    consoleSpy.mockRestore();
  });

  test('stop closes all watchers cleanly', () => {
    const dir = makeTmpDir();
    writeEnvFile(dir, '.env', 'A=1');
    writeEnvFile(dir, '.env.development', 'B=2');
    const stop = watchEnv({ cwd: dir, env: 'development', apply: false });
    expect(() => stop()).not.toThrow();
  });
});
