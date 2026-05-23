const path = require('path');
const os = require('os');
const fs = require('fs');
const { resolveLayers, filterExistingLayers, getActiveLayers, DEFAULT_LAYERS } = require('./layers');

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pour-env-layers-'));
}

describe('resolveLayers', () => {
  test('interpolates NODE_ENV into pattern', () => {
    const layers = resolveLayers('production', ['.env.{NODE_ENV}'], '/app');
    expect(layers).toEqual(['/app/.env.production']);
  });

  test('returns default layer count', () => {
    const layers = resolveLayers('test', DEFAULT_LAYERS, '/app');
    expect(layers).toHaveLength(DEFAULT_LAYERS.length);
  });

  test('resolves absolute paths relative to cwd', () => {
    const layers = resolveLayers('development', ['.env'], '/my/project');
    expect(layers[0]).toBe('/my/project/.env');
  });

  test('throws when env is empty', () => {
    expect(() => resolveLayers('')).toThrow('env must be a non-empty string');
  });

  test('throws when env is not a string', () => {
    expect(() => resolveLayers(null)).toThrow();
  });
});

describe('filterExistingLayers', () => {
  test('returns only files that exist', () => {
    const dir = makeTmpDir();
    const existing = path.join(dir, '.env');
    const missing = path.join(dir, '.env.local');
    fs.writeFileSync(existing, 'FOO=1');

    const result = filterExistingLayers([existing, missing]);
    expect(result).toEqual([existing]);
  });

  test('returns empty array when no files exist', () => {
    expect(filterExistingLayers(['/nonexistent/.env'])).toEqual([]);
  });

  test('uses injected fs module', () => {
    const mockFs = { accessSync: jest.fn() };
    const result = filterExistingLayers(['/fake/.env'], mockFs);
    expect(result).toEqual(['/fake/.env']);
    expect(mockFs.accessSync).toHaveBeenCalledWith('/fake/.env');
  });
});

describe('getActiveLayers', () => {
  test('returns existing layers for given env', () => {
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, '.env'), 'BASE=1');
    fs.writeFileSync(path.join(dir, '.env.test'), 'TEST=1');

    const layers = getActiveLayers({ env: 'test', cwd: dir });
    expect(layers.some((l) => l.endsWith('.env'))).toBe(true);
    expect(layers.some((l) => l.endsWith('.env.test'))).toBe(true);
    expect(layers.some((l) => l.endsWith('.env.local'))).toBe(false);
  });

  test('falls back to development when NODE_ENV unset', () => {
    const orig = process.env.NODE_ENV;
    delete process.env.NODE_ENV;
    const dir = makeTmpDir();
    fs.writeFileSync(path.join(dir, '.env.development'), 'DEV=1');

    const layers = getActiveLayers({ cwd: dir });
    expect(layers.some((l) => l.endsWith('.env.development'))).toBe(true);
    process.env.NODE_ENV = orig;
  });
});
