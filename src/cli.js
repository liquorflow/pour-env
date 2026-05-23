#!/usr/bin/env node
import { loadEnv } from './loader.js';
import { redactEnv } from './redact.js';
import { exportEnv, printEnv } from './export.js';

const args = process.argv.slice(2);

function parseArgs(args) {
  const opts = {
    env: 'development',
    format: 'dotenv',
    output: null,
    overwrite: false,
    redact: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') opts.help = true;
    else if (arg === '--redact') opts.redact = true;
    else if (arg === '--overwrite') opts.overwrite = true;
    else if (arg === '--env' || arg === '-e') opts.env = args[++i];
    else if (arg === '--format' || arg === '-f') opts.format = args[++i];
    else if (arg === '--output' || arg === '-o') opts.output = args[++i];
  }

  return opts;
}

function printHelp() {
  console.log(`
pour-env — layered dotenv manager

Usage:
  pour-env [options]

Options:
  -e, --env <name>      Environment name (default: development)
  -f, --format <fmt>    Output format: dotenv | json (default: dotenv)
  -o, --output <path>   Write output to file instead of stdout
      --redact          Redact secret values in output
      --overwrite       Overwrite output file if it exists
  -h, --help            Show this help message
`.trim());
}

async function main() {
  const opts = parseArgs(args);

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  let env;
  try {
    env = await loadEnv({ env: opts.env });
  } catch (err) {
    console.error(`Error loading env: ${err.message}`);
    process.exit(1);
  }

  if (opts.redact) {
    env = redactEnv(env);
  }

  if (opts.output) {
    try {
      const written = exportEnv(env, opts.output, {
        format: opts.format,
        overwrite: opts.overwrite,
      });
      console.error(`Written to ${written}`);
    } catch (err) {
      console.error(`Error writing output: ${err.message}`);
      process.exit(1);
    }
  } else {
    printEnv(env, { format: opts.format });
  }
}

main();
