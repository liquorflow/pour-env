const { validateEnv, parseSchema } = require('./validate');

describe('parseSchema', () => {
  test('expands shorthand string type to object', () => {
    const schema = parseSchema({ PORT: 'number', NAME: 'string' });
    expect(schema.PORT).toEqual({ required: true, type: 'number' });
    expect(schema.NAME).toEqual({ required: true, type: 'string' });
  });

  test('passes through full object definitions unchanged', () => {
    const raw = { HOST: { required: false, type: 'url' } };
    expect(parseSchema(raw).HOST).toEqual({ required: false, type: 'url' });
  });
});

describe('validateEnv', () => {
  test('passes when all required vars are present', () => {
    const result = validateEnv(
      { PORT: '3000', NODE_ENV: 'production' },
      { PORT: { required: true }, NODE_ENV: { required: true } }
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('reports missing required variable', () => {
    const result = validateEnv({}, { SECRET_KEY: { required: true } });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/SECRET_KEY/);
  });

  test('validates number type', () => {
    const schema = { PORT: { required: true, type: 'number' } };
    expect(validateEnv({ PORT: '3000' }, schema).valid).toBe(true);
    expect(validateEnv({ PORT: 'abc' }, schema).valid).toBe(false);
  });

  test('validates boolean type', () => {
    const schema = { DEBUG: { required: true, type: 'boolean' } };
    expect(validateEnv({ DEBUG: 'true' }, schema).valid).toBe(true);
    expect(validateEnv({ DEBUG: 'yes' }, schema).valid).toBe(false);
  });

  test('validates url type', () => {
    const schema = { API_URL: { required: true, type: 'url' } };
    expect(validateEnv({ API_URL: 'https://example.com' }, schema).valid).toBe(true);
    expect(validateEnv({ API_URL: 'not-a-url' }, schema).valid).toBe(false);
  });

  test('validates pattern', () => {
    const schema = { VERSION: { required: true, pattern: '^\\d+\\.\\d+\\.\\d+$' } };
    expect(validateEnv({ VERSION: '1.2.3' }, schema).valid).toBe(true);
    expect(validateEnv({ VERSION: 'v1.2' }, schema).valid).toBe(false);
  });

  test('validates allowedValues', () => {
    const schema = { LOG_LEVEL: { required: true, allowedValues: ['debug', 'info', 'warn', 'error'] } };
    expect(validateEnv({ LOG_LEVEL: 'info' }, schema).valid).toBe(true);
    expect(validateEnv({ LOG_LEVEL: 'verbose' }, schema).valid).toBe(false);
  });

  test('skips optional missing vars without error', () => {
    const schema = { OPTIONAL: { required: false, type: 'number' } };
    expect(validateEnv({}, schema).valid).toBe(true);
  });

  test('accumulates multiple errors', () => {
    const schema = {
      A: { required: true },
      B: { required: true },
    };
    const result = validateEnv({}, schema);
    expect(result.errors).toHaveLength(2);
  });
});
