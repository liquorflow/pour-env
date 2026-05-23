import fs from 'fs';
import path from 'path';

/**
 * Infer the type of a value string
 */
export function inferType(value) {
  if (value === 'true' || value === 'false') return 'boolean';
  if (value !== '' && !isNaN(Number(value))) return 'number';
  if (value === '') return 'string';
  return 'string';
}

/**
 * Check if a key looks like a secret
 */
export function looksLikeSecret(key) {
  const secretPatterns = /secret|password|passwd|token|key|api_key|private|auth|credential/i;
  return secretPatterns.test(key);
}

/**
 * Generate a schema object from a parsed env object
 */
export function generateSchema(envObj) {
  const schema = {};
  for (const [key, value] of Object.entries(envObj)) {
    schema[key] = {
      type: inferType(value),
      required: true,
      secret: looksLikeSecret(key),
    };
    if (value !== '') {
      schema[key].default = value;
    }
  }
  return schema;
}

/**
 * Serialize a schema object to a JSON file
 */
export function saveSchema(schema, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2), 'utf8');
}

/**
 * Generate and save a schema from an env file path
 */
export function generateSchemaFromFile(envFilePath, outputPath) {
  if (!fs.existsSync(envFilePath)) throw new Error(`Env file not found: ${envFilePath}`);
  const raw = fs.readFileSync(envFilePath, 'utf8');
  const envObj = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    envObj[key] = value;
  }
  const schema = generateSchema(envObj);
  saveSchema(schema, outputPath);
  return schema;
}
