import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY_LEN = 32;
const IV_LEN = 16;
const SALT_LEN = 16;

function deriveKey(passphrase, salt) {
  return scryptSync(passphrase, salt, KEY_LEN);
}

export function encryptValue(value, passphrase) {
  const salt = randomBytes(SALT_LEN);
  const iv = randomBytes(IV_LEN);
  const key = deriveKey(passphrase, salt);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ]);
  const payload = Buffer.concat([salt, iv, encrypted]);
  return 'enc:' + payload.toString('base64');
}

export function decryptValue(encoded, passphrase) {
  if (!encoded.startsWith('enc:')) {
    throw new Error('Value is not encrypted');
  }
  const payload = Buffer.from(encoded.slice(4), 'base64');
  const salt = payload.subarray(0, SALT_LEN);
  const iv = payload.subarray(SALT_LEN, SALT_LEN + IV_LEN);
  const encrypted = payload.subarray(SALT_LEN + IV_LEN);
  const key = deriveKey(passphrase, salt);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

export function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith('enc:');
}

export function encryptEnv(env, passphrase, keys = null) {
  const result = {};
  for (const [k, v] of Object.entries(env)) {
    const shouldEncrypt = keys ? keys.includes(k) : true;
    result[k] = shouldEncrypt && !isEncrypted(v) ? encryptValue(v, passphrase) : v;
  }
  return result;
}

export function decryptEnv(env, passphrase) {
  const result = {};
  for (const [k, v] of Object.entries(env)) {
    result[k] = isEncrypted(v) ? decryptValue(v, passphrase) : v;
  }
  return result;
}
