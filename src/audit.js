import fs from 'fs';
import path from 'path';

/**
 * Audit log entry structure:
 * { timestamp, action, keys, source, redacted }
 */

export function createAuditEntry(action, keys, source = null, redacted = false) {
  return {
    timestamp: new Date().toISOString(),
    action,
    keys: Array.isArray(keys) ? keys : [keys],
    source,
    redacted,
  };
}

export function writeAuditLog(entry, logPath) {
  const line = JSON.stringify(entry) + '\n';
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, line, 'utf8');
}

export function readAuditLog(logPath) {
  if (!fs.existsSync(logPath)) return [];
  const raw = fs.readFileSync(logPath, 'utf8').trim();
  if (!raw) return [];
  return raw.split('\n').map((line) => JSON.parse(line));
}

export function clearAuditLog(logPath) {
  if (fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, '', 'utf8');
  }
}

export function auditLoad(keys, source, logPath) {
  const entry = createAuditEntry('load', keys, source, false);
  writeAuditLog(entry, logPath);
  return entry;
}

export function auditRedact(keys, source, logPath) {
  const entry = createAuditEntry('redact', keys, source, true);
  writeAuditLog(entry, logPath);
  return entry;
}

export function auditExport(keys, source, logPath) {
  const entry = createAuditEntry('export', keys, source, false);
  writeAuditLog(entry, logPath);
  return entry;
}

export function filterAuditLog(logPath, { action, since } = {}) {
  const entries = readAuditLog(logPath);
  return entries.filter((e) => {
    if (action && e.action !== action) return false;
    if (since && new Date(e.timestamp) < new Date(since)) return false;
    return true;
  });
}
