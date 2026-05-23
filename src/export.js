import fs from 'fs';
import path from 'path';

/**
 * Serialize env object to dotenv format string
 * @param {Record<string, string>} env
 * @returns {string}
 */
export function serializeEnv(env) {
  return Object.entries(env)
    .map(([key, value]) => {
      const needsQuotes = /[\s#"'\\]/.test(value) || value === '';
      const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return needsQuotes ? `${key}="${escaped}"` : `${key}=${value}`;
    })
    .join('\n') + '\n';
}

/**
 * Export merged env to a file
 * @param {Record<string, string>} env
 * @param {string} outputPath
 * @param {{ format?: 'dotenv' | 'json', overwrite?: boolean }} options
 */
export function exportEnv(env, outputPath, options = {}) {
  const { format = 'dotenv', overwrite = false } = options;

  const resolved = path.resolve(outputPath);

  if (!overwrite && fs.existsSync(resolved)) {
    throw new Error(`File already exists: ${resolved}. Use overwrite: true to replace it.`);
  }

  let content;
  if (format === 'json') {
    content = JSON.stringify(env, null, 2) + '\n';
  } else {
    content = serializeEnv(env);
  }

  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, content, 'utf8');

  return resolved;
}

/**
 * Export env to stdout
 * @param {Record<string, string>} env
 * @param {{ format?: 'dotenv' | 'json' }} options
 */
export function printEnv(env, options = {}) {
  const { format = 'dotenv' } = options;
  if (format === 'json') {
    process.stdout.write(JSON.stringify(env, null, 2) + '\n');
  } else {
    process.stdout.write(serializeEnv(env));
  }
}
