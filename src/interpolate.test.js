const { interpolateValue, interpolateEnv, hasInterpolation } = require('./interpolate');

describe('interpolateValue', () => {
  test('expands ${VAR} syntax', () => {
    const ctx = { HOME: '/home/user' };
    expect(interpolateValue('path is ${HOME}/bin', ctx)).toBe('path is /home/user/bin');
  });

  test('expands $VAR syntax', () => {
    const ctx = { APP: 'myapp' };
    expect(interpolateValue('hello $APP world', ctx)).toBe('hello myapp world');
  });

  test('leaves unknown vars as-is', () => {
    expect(interpolateValue('${UNKNOWN_VAR}', {})).toBe('${UNKNOWN_VAR}');
  });

  test('handles multiple expansions in one string', () => {
    const ctx = { HOST: 'localhost', PORT: '5432' };
    expect(interpolateValue('${HOST}:${PORT}', ctx)).toBe('localhost:5432');
  });

  test('returns non-string values unchanged', () => {
    expect(interpolateValue(42, {})).toBe(42);
    expect(interpolateValue(null, {})).toBe(null);
  });

  test('handles empty string', () => {
    expect(interpolateValue('', { FOO: 'bar' })).toBe('');
  });

  test('does not double-expand already resolved values', () => {
    const ctx = { A: '$B', B: 'real' };
    // $A resolves to '$B' literally — no second pass
    expect(interpolateValue('$A', ctx)).toBe('$B');
  });
});

describe('interpolateEnv', () => {
  test('resolves references between env vars in order', () => {
    const env = {
      BASE: '/app',
      DATA: '${BASE}/data',
      LOGS: '${DATA}/logs',
    };
    const result = interpolateEnv(env);
    expect(result.BASE).toBe('/app');
    expect(result.DATA).toBe('/app/data');
    expect(result.LOGS).toBe('/app/data/logs');
  });

  test('falls back to process.env for unknown vars', () => {
    process.env._TEST_INTERP_VAR = 'fromprocess';
    const env = { GREETING: 'hello ${_TEST_INTERP_VAR}' };
    const result = interpolateEnv(env);
    expect(result.GREETING).toBe('hello fromprocess');
    delete process.env._TEST_INTERP_VAR;
  });

  test('leaves unresolvable vars as-is', () => {
    const env = { FOO: '${DEFINITELY_NOT_SET_XYZ}' };
    const result = interpolateEnv(env);
    expect(result.FOO).toBe('${DEFINITELY_NOT_SET_XYZ}');
  });

  test('returns empty object for empty input', () => {
    expect(interpolateEnv({})).toEqual({});
  });
});

describe('hasInterpolation', () => {
  test('detects ${VAR} tokens', () => {
    expect(hasInterpolation('hello ${WORLD}')).toBe(true);
  });

  test('detects $VAR tokens', () => {
    expect(hasInterpolation('value is $HOME')).toBe(true);
  });

  test('returns false when no tokens present', () => {
    expect(hasInterpolation('just a plain string')).toBe(false);
    expect(hasInterpolation('')).toBe(false);
  });
});
