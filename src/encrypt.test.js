import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  encryptValue,
  decryptValue,
  isEncrypted,
  encryptEnv,
  decryptEnv,
} from './encrypt.js';

const PASS = 'super-secret-passphrase';

describe('isEncrypted', () => {
  it('returns true for enc: prefixed values', () => {
    assert.equal(isEncrypted('enc:abc123'), true);
  });

  it('returns false for plain values', () => {
    assert.equal(isEncrypted('plaintext'), false);
    assert.equal(isEncrypted(''), false);
  });
});

describe('encryptValue / decryptValue', () => {
  it('round-trips a simple string', () => {
    const original = 'my_secret_value';
    const encrypted = encryptValue(original, PASS);
    assert.equal(isEncrypted(encrypted), true);
    assert.equal(decryptValue(encrypted, PASS), original);
  });

  it('produces different ciphertext each call (random IV)', () => {
    const a = encryptValue('hello', PASS);
    const b = encryptValue('hello', PASS);
    assert.notEqual(a, b);
  });

  it('throws when decrypting without enc: prefix', () => {
    assert.throws(() => decryptValue('notencrypted', PASS), /not encrypted/);
  });

  it('throws on wrong passphrase', () => {
    const enc = encryptValue('secret', PASS);
    assert.throws(() => decryptValue(enc, 'wrong-pass'));
  });
});

describe('encryptEnv', () => {
  it('encrypts all values by default', () => {
    const env = { FOO: 'bar', BAZ: 'qux' };
    const result = encryptEnv(env, PASS);
    assert.equal(isEncrypted(result.FOO), true);
    assert.equal(isEncrypted(result.BAZ), true);
  });

  it('encrypts only specified keys', () => {
    const env = { FOO: 'bar', BAZ: 'qux' };
    const result = encryptEnv(env, PASS, ['FOO']);
    assert.equal(isEncrypted(result.FOO), true);
    assert.equal(result.BAZ, 'qux');
  });

  it('does not double-encrypt already encrypted values', () => {
    const env = { FOO: encryptValue('bar', PASS) };
    const result = encryptEnv(env, PASS);
    assert.equal(decryptValue(result.FOO, PASS), 'bar');
  });
});

describe('decryptEnv', () => {
  it('decrypts all encrypted values and leaves plain ones', () => {
    const env = {
      SECRET: encryptValue('topsecret', PASS),
      PLAIN: 'visible',
    };
    const result = decryptEnv(env, PASS);
    assert.equal(result.SECRET, 'topsecret');
    assert.equal(result.PLAIN, 'visible');
  });
});
