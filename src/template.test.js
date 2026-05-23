import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  parseTemplate,
  loadTemplate,
  checkAgainstTemplate,
  generateEnvFromTemplate,
} from './template.js';

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pour-env-template-'));
}

describe('parseTemplate', () => {
  it('parses required keys (empty value)', () => {
    const t = parseTemplate('DATABASE_URL=\n');
    expect(t.DATABASE_URL.required).toBe(true);
    expect(t.DATABASE_URL.default).toBeUndefined();
  });

  it('parses required keys (REQUIRED sentinel)', () => {
    const t = parseTemplate('API_KEY=REQUIRED\n');
    expect(t.API_KEY.required).toBe(true);
  });

  it('parses optional keys with defaults', () => {
    const t = parseTemplate('PORT=3000\n');
    expect(t.PORT.required).toBe(false);
    expect(t.PORT.default).toBe('3000');
  });

  it('captures preceding comment as description', () => {
    const t = parseTemplate('# The app port\nPORT=8080\n');
    expect(t.PORT.description).toBe('The app port');
  });

  it('ignores blank lines between entries', () => {
    const t = parseTemplate('A=1\n\nB=2\n');
    expect(Object.keys(t)).toEqual(['A', 'B']);
  });
});

describe('loadTemplate', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => fs.rmSync(tmpDir, { recursive: true }));

  it('loads and parses a template file', () => {
    const p = path.join(tmpDir, '.env.template');
    fs.writeFileSync(p, 'HOST=localhost\nSECRET=\n');
    const t = loadTemplate(p);
    expect(t.HOST.default).toBe('localhost');
    expect(t.SECRET.required).toBe(true);
  });

  it('throws if file does not exist', () => {
    expect(() => loadTemplate(path.join(tmpDir, 'missing.template'))).toThrow('not found');
  });
});

describe('checkAgainstTemplate', () => {
  const template = {
    HOST: { required: false, description: null, default: 'localhost' },
    SECRET: { required: true, description: 'API secret', default: undefined },
    PORT: { required: false, description: null, default: '3000' },
  };

  it('reports missing required keys', () => {
    const { missing } = checkAgainstTemplate({ HOST: 'x' }, template);
    expect(missing.map(m => m.key)).toContain('SECRET');
  });

  it('fills in defaults for missing optional keys', () => {
    const { withDefaults } = checkAgainstTemplate({ SECRET: 'abc' }, template);
    expect(withDefaults.HOST).toBe('localhost');
    expect(withDefaults.PORT).toBe('3000');
  });

  it('reports extra keys not in template', () => {
    const { extra } = checkAgainstTemplate({ SECRET: 'x', EXTRA_VAR: '1' }, template);
    expect(extra).toContain('EXTRA_VAR');
  });
});

describe('generateEnvFromTemplate', () => {
  it('produces a valid .env string with defaults', () => {
    const template = {
      PORT: { required: false, description: 'Server port', default: '3000' },
      SECRET: { required: true, description: null, default: undefined },
    };
    const out = generateEnvFromTemplate(template);
    expect(out).toContain('PORT=3000');
    expect(out).toContain('SECRET=');
    expect(out).toContain('# Server port');
  });
});
