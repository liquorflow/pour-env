# Snapshot & History

The `snapshot` and `history` modules give `pour-env` a lightweight audit trail for environment changes.

## snapshot.js

| Export | Description |
|---|---|
| `saveSnapshot(env, path, meta?)` | Serialize `env` to a JSON file with an ISO timestamp and optional metadata. |
| `loadSnapshot(path)` | Read and parse a snapshot file. Throws if the file is missing. |
| `diffEnv(before, after)` | Return `{ added, removed, changed }` between two env objects. |
| `listSnapshots(dir)` | List `.json` files in a directory, sorted newest-first. |

## history.js

Builds on `snapshot.js` to maintain a timestamped history directory (default: `.pour-env/history`).

| Export | Description |
|---|---|
| `recordHistory(env, opts?)` | Append a new snapshot to the history dir. Accepts `{ dir, label }`. |
| `getHistory(opts?)` | Return up to `limit` (default 10) most-recent entries. |
| `diffLastTwo(opts?)` | Diff the two most-recent history entries. Returns `null` if fewer than 2 exist. |
| `clearHistory(opts?)` | Delete all history files; returns count of deleted files. |

## Usage

```js
import { recordHistory, getHistory, diffLastTwo } from './src/history.js';

// Record current env
recordHistory(process.env, { label: 'pre-deploy' });

// Later — see what changed
const diff = diffLastTwo();
console.log('Added:', diff.added);
console.log('Changed:', diff.changed);
```

## File format

```json
{
  "timestamp": "2024-06-01T12:00:00.000Z",
  "label": "pre-deploy",
  "env": {
    "NODE_ENV": "production",
    "PORT": "8080"
  }
}
```
