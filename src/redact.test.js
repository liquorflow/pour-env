const { isSecret, redactEnv, redactString, REDACTED } = require('./redact');

describe('isSecret', () => {
  test('matches password keys', () => {
    expect(isSecret('DB_PASSWORD')).toBe(true);
    expect(isSecret('user_password')).toBe(true);
  });

  test('matches token keys', () => {
    expect(isSecret('GITHUB_TOKEN')).toBe(true);
    expect(isSecret('access_token')).toBe(true);
  });

  test('matches api_key keys', () => {
    expect(isSecret('STRIPE_API_KEY')).toBe(true);
  });

  test('does not match safe keys', () => {
    expect(isSecret('NODE_ENV')).toBe(false);
    expect(isSecret('PORT')).toBe(false);
    expect(isSecret('APP_NAME')).toBe(false);
  });

  test('supports custom patterns', () => {
    expect(isSecret('MY_CUSTOM_FIELD', [/custom/i])).toBe(true);
    expect(isSecret('GITHUB_TOKEN', [/custom/i])).toBe(false);
  });
});

describe('redactEnv', () => {
  const env = {
    NODE_ENV: 'production',
    PORT: '3000',
    DB_PASSWORD: 'supersecret',
    GITHUB_TOKEN: 'ghp_abc123',
    APP_NAME: 'pour-env',
  };

  test('redacts secret keys and preserves safe keys', () => {
    const result = redactEnv(env);
    expect(result.NODE_ENV).toBe('production');
    expect(result.PORT).toBe('3000');
    expect(result.APP_NAME).toBe('pour-env');
    expect(result.DB_PASSWORD).toBe(REDACTED);
    expect(result.GITHUB_TOKEN).toBe(REDACTED);
  });

  test('redacts explicitly listed additional keys', () => {
    const result = redactEnv(env, { additionalKeys: ['APP_NAME'] });
    expect(result.APP_NAME).toBe(REDACTED);
    expect(result.PORT).toBe('3000');
  });

  test('returns a new object, does not mutate input', () => {
    const copy = { ...env };
    redactEnv(copy);
    expect(copy.DB_PASSWORD).toBe('supersecret');
  });
});

describe('redactString', () => {
  const env = {
    DB_PASSWORD: 'supersecret',
    NODE_ENV: 'production',
  };

  test('replaces secret values in a string', () => {
    const log = 'Connecting with password supersecret to db';
    expect(redactString(log, env)).toBe(
      `Connecting with password ${REDACTED} to db`
    );
  });

  test('leaves non-secret values intact', () => {
    const log = 'Running in production mode';
    expect(redactString(log, env)).toBe('Running in production mode');
  });

  test('handles multiple occurrences', () => {
    const log = 'supersecret and supersecret again';
    const result = redactString(log, env);
    expect(result).not.toContain('supersecret');
    expect(result.split(REDACTED).length).toBe(3);
  });
});
