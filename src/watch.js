const fs = require('fs');
const path = require('path');
const { loadEnv, applyEnv } = require('./loader');
const { getActiveLayers } = require('./layers');

let watchers = [];

/**
 * Watch env files for changes and reload when modified.
 * @param {object} options
 * @param {string} options.cwd - working directory
 * @param {string} options.env - environment name (e.g. 'development')
 * @param {function} options.onChange - callback fired with new env object on change
 * @param {boolean} options.apply - whether to apply changes to process.env
 * @returns {function} stop - call to stop all watchers
 */
function watchEnv(options = {}) {
  const {
    cwd = process.cwd(),
    env = process.env.NODE_ENV || 'development',
    onChange = null,
    apply = true,
  } = options;

  const layers = getActiveLayers(env, cwd);
  const existing = layers.filter((f) => {
    try {
      fs.accessSync(f);
      return true;
    } catch {
      return false;
    }
  });

  if (existing.length === 0) {
    console.warn('[pour-env] watch: no env files found to watch');
    return () => {};
  }

  watchers = existing.map((filePath) => {
    const watcher = fs.watch(filePath, { persistent: false }, (eventType) => {
      if (eventType !== 'change') return;
      try {
        const newEnv = loadEnv({ cwd, env });
        if (apply) applyEnv(newEnv);
        if (typeof onChange === 'function') onChange(newEnv, filePath);
      } catch (err) {
        console.error(`[pour-env] watch: failed to reload after change in ${filePath}:`, err.message);
      }
    });
    return watcher;
  });

  return function stop() {
    watchers.forEach((w) => w.close());
    watchers = [];
  };
}

module.exports = { watchEnv };
