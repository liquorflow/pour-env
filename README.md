# pour-env

> A dotenv manager that supports layered environment configs with secret redaction for CI pipelines.

## Installation

```bash
npm install pour-env
```

## Usage

Create layered `.env` files that are merged in order of priority:

```
.env              # base defaults
.env.local        # local overrides (gitignored)
.env.production   # environment-specific values
```

```js
import { load } from 'pour-env';

const env = load({
  layers: ['.env', '.env.local', `.env.${process.env.NODE_ENV}`],
  redact: ['API_KEY', 'DB_PASSWORD', 'SECRET_TOKEN'],
});

console.log(env.DB_HOST);      // "localhost"
console.log(env.API_KEY);      // "[REDACTED]" in CI, real value locally
```

Enable CI mode to automatically redact secrets from logs:

```js
const env = load({
  layers: ['.env', '.env.production'],
  redact: ['API_KEY', 'DB_PASSWORD'],
  ci: process.env.CI === 'true',
});
```

Variables from later layers override earlier ones. Redacted keys return `[REDACTED]` when `ci` is `true`, keeping sensitive values out of build logs.

## API

| Option   | Type       | Description                              |
|----------|------------|------------------------------------------|
| `layers` | `string[]` | Ordered list of `.env` files to load     |
| `redact` | `string[]` | Keys to redact in CI environments        |
| `ci`     | `boolean`  | Enable secret redaction (default: false) |

## License

[MIT](./LICENSE)