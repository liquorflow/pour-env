# Schema Generation

`schema-gen.js` provides utilities to automatically generate a JSON validation schema from an existing `.env` file. This is useful when bootstrapping a new project or enforcing structure on an existing env setup.

## Functions

### `inferType(value)`
Infers the type of an env value string. Returns `'boolean'`, `'number'`, or `'string'`.

```js
inferType('true')   // 'boolean'
inferType('3000')   // 'number'
inferType('hello')  // 'string'
```

### `looksLikeSecret(key)`
Returns `true` if the key name matches common secret patterns (e.g. `API_KEY`, `DB_PASSWORD`, `AUTH_TOKEN`).

### `generateSchema(envObj)`
Takes a plain object of env key/value pairs and returns a schema object compatible with `src/validate.js`.

```js
generateSchema({ PORT: '3000', API_KEY: 'abc' })
// {
//   PORT: { type: 'number', required: true, secret: false, default: '3000' },
//   API_KEY: { type: 'string', required: true, secret: true, default: 'abc' }
// }
```

### `saveSchema(schema, outputPath)`
Serializes and writes the schema to a JSON file at `outputPath`.

### `generateSchemaFromFile(envFilePath, outputPath)`
Reads an `.env` file, generates a schema, saves it to `outputPath`, and returns the schema object.

```js
import { generateSchemaFromFile } from './schema-gen.js';

const schema = generateSchemaFromFile('.env', '.env.schema.json');
```

## Notes
- Empty values will not have a `default` field in the schema.
- Keys are assumed `required: true` by default; edit the generated schema as needed.
- Use the output with `validateEnv` from `src/validate.js` to enforce types at runtime.
