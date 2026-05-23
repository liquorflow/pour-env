# Template Support

`pour-env` supports `.env.template` files to document and validate required environment variables.

## Format

A template file looks like a standard `.env` file, with two conventions:

- A key with an **empty value** or the sentinel `REQUIRED` marks it as required.
- A key with a **non-empty value** marks it as optional with that value as the default.
- A `# comment` immediately above a key becomes its description.

```
# Database connection string
DATABASE_URL=REQUIRED

# Application port
PORT=3000

DEBUG=false
```

## API

### `parseTemplate(content: string)`

Parses the raw string content of a template file and returns a map:

```js
{
  DATABASE_URL: { required: true, description: 'Database connection string', default: undefined },
  PORT:         { required: false, description: 'Application port', default: '3000' },
}
```

### `loadTemplate(templatePath: string)`

Reads a template file from disk and returns the parsed result. Throws if the file does not exist.

### `checkAgainstTemplate(env, template)`

Compares a loaded env object against a parsed template. Returns:

```js
{
  missing: [{ key, description }],  // required keys absent from env
  extra:   ['KEY', ...],            // keys in env not present in template
  withDefaults: { ...env },         // env merged with template defaults
}
```

### `generateEnvFromTemplate(template)`

Generates a blank `.env` file string from a template, filling in default values and including comments.

## CLI Usage

```bash
# Validate current .env against a template
pour-env validate --template .env.template

# Generate a blank .env from a template
pour-env init --template .env.template
```
