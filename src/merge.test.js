const { mergeLayers, mergeSafe } = require('./merge');

const layer = (filePath, values) => ({ filePath, values });

describe('mergeLayers', () => {
  test('merges a single layer', () => {
    const { merged } = mergeLayers([layer('.env', { FOO: 'bar' })]);
    expect(merged).toEqual({ FOO: 'bar' });
  });

  test('later layers override earlier ones', () => {
    const { merged } = mergeLayers([
      layer('.env', { FOO: 'base', BAR: 'base' }),
      layer('.env.local', { FOO: 'local' }),
    ]);
    expect(merged.FOO).toBe('local');
    expect(merged.BAR).toBe('base');
  });

  test('tracks source file per key', () => {
    const { sources } = mergeLayers([
      layer('.env', { FOO: 'base' }),
      layer('.env.local', { FOO: 'local', BAR: 'local' }),
    ]);
    expect(sources.FOO).toBe('.env.local');
    expect(sources.BAR).toBe('.env.local');
  });

  test('returns empty objects for empty input', () => {
    const { merged, sources } = mergeLayers([]);
    expect(merged).toEqual({});
    expect(sources).toEqual({});
  });

  test('throws for non-array input', () => {
    expect(() => mergeLayers(null)).toThrow(TypeError);
  });

  test('throws for layer missing values', () => {
    expect(() => mergeLayers([{ filePath: '.env' }])).toThrow(TypeError);
  });

  test('handles unknown filePath gracefully', () => {
    const { sources } = mergeLayers([{ values: { X: '1' } }]);
    expect(sources.X).toBe('unknown');
  });
});

describe('mergeSafe', () => {
  test('skips keys already in processEnv', () => {
    const { merged } = mergeSafe(
      [layer('.env', { FOO: 'from-file', BAR: 'from-file' })],
      { FOO: 'existing' }
    );
    expect(merged.FOO).toBeUndefined();
    expect(merged.BAR).toBe('from-file');
  });

  test('includes all keys when processEnv is empty', () => {
    const { merged } = mergeSafe(
      [layer('.env', { FOO: '1', BAR: '2' })],
      {}
    );
    expect(merged).toEqual({ FOO: '1', BAR: '2' });
  });

  test('sources reflect only non-skipped keys', () => {
    const { sources } = mergeSafe(
      [layer('.env', { FOO: '1' })],
      { FOO: 'existing' }
    );
    expect(sources.FOO).toBeUndefined();
  });
});
