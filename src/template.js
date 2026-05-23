import fs from 'fs';
import path from 'path';

/**
 * Parse a .env.template file into a map of key -> { required, description, default }
 */
export function parseTemplate(content) {
  const result = {};
  const lines = content.split('\n');
  let lastComment = null;

  for (const raw of lines) {
    const line = raw.trim();

    if (line.startsWith('#')) {
      lastComment = line.slice(1).trim();
      continue;
    }

    if (!line || !line.includes('=')) {
      lastComment = null;
      continue;
    }

    const eqIdx = line.indexOf('=');
    const key = line.slice(0, eqIdx).trim();
    const rawVal = line.slice(eqIdx + 1).trim();

    const required = rawVal === '' || rawVal.toUpperCase() === 'REQUIRED';
    const defaultValue = required ? undefined : rawVal;

    result[key] = {
      required,
      description: lastComment || null,
      default: defaultValue,
    };

    lastComment = null;
  }

  return result;
}

/**
 * Load and parse a template file from disk.
 */
export function loadTemplate(templatePath) {
  const resolved = path.resolve(templatePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Template file not found: ${resolved}`);
  }
  const content = fs.readFileSync(resolved, 'utf8');
  return parseTemplate(content);
}

/**
 * Check an env object against a parsed template.
 * Returns { missing, extra, withDefaults }.
 */
export function checkAgainstTemplate(env, template) {
  const missing = [];
  const withDefaults = { ...env };

  for (const [key, meta] of Object.entries(template)) {
    if (!(key in env)) {
      if (meta.required) {
        missing.push({ key, description: meta.description });
      } else if (meta.default !== undefined) {
        withDefaults[key] = meta.default;
      }
    }
  }

  const templateKeys = new Set(Object.keys(template));
  const extra = Object.keys(env).filter(k => !templateKeys.has(k));

  return { missing, extra, withDefaults };
}

/**
 * Generate a blank .env file from a template, filling in defaults.
 */
export function generateEnvFromTemplate(template) {
  const lines = [];
  for (const [key, meta] of Object.entries(template)) {
    if (meta.description) lines.push(`# ${meta.description}`);
    lines.push(`${key}=${meta.required ? '' : (meta.default ?? '')}`);
    lines.push('');
  }
  return lines.join('\n').trimEnd() + '\n';
}
