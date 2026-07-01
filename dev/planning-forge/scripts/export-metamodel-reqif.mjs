#!/usr/bin/env node
// Export a validated Planning Forge metamodel artifact to a ReqIF 1.0 document.
//
// This is a one-way publish: it serializes the canonical JSON/YAML model into
// ReqIF for requirements/ALM tools. It does not import ReqIF back. The JSON/YAML
// artifact remains the source of truth; run validate-metamodel.mjs first.
//
// Usage:
//   node dev/planning-forge/scripts/export-metamodel-reqif.mjs <artifact.(json|yaml|yml)> [--out <file>]
//
// Exit codes:
//   0 = ReqIF written (stdout or --out file)
//   2 = invalid usage, missing/unparseable artifact, or unwritable output

import { existsSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from '../../../code-explorer/scripts/lib/cli.mjs';
import { loadArtifact } from './lib/artifact.mjs';
import { buildReqif } from './lib/reqif.mjs';

const ARG_SPEC = {
  positionals: [{ name: 'artifact', required: true }],
  flags: {
    '--out': { type: 'value', default: '' },
  },
};

function usageError(message) {
  process.stderr.write(`error: ${message}\n`);
  process.stderr.write(
    'usage: node dev/planning-forge/scripts/export-metamodel-reqif.mjs <artifact.(json|yaml|yml)> [--out <file>]\n',
  );
  process.exit(2);
}

function main() {
  const { values: args, error } = parseArgs(process.argv.slice(2), ARG_SPEC);
  if (error) usageError(error);

  const artifactPath = resolve(args.artifact);
  if (!existsSync(artifactPath) || !statSync(artifactPath).isFile()) {
    usageError(`artifact file not found: ${artifactPath}`);
  }

  let artifact;
  try {
    artifact = loadArtifact(artifactPath);
  } catch (err) {
    usageError(err.message);
  }
  if (artifact === null || typeof artifact !== 'object' || Array.isArray(artifact)) {
    usageError('artifact root must be a mapping/object');
  }
  if (artifact.nodes !== undefined && !Array.isArray(artifact.nodes)) {
    usageError('artifact `nodes` must be an array');
  }
  if (artifact.edges !== undefined && !Array.isArray(artifact.edges)) {
    usageError('artifact `edges` must be an array');
  }

  let output;
  try {
    output = buildReqif(artifact);
  } catch (err) {
    usageError(err.message);
  }

  if (args.out) {
    const outPath = resolve(args.out);
    try {
      writeFileSync(outPath, output);
    } catch (err) {
      usageError(`could not write ${args.out}: ${err.message}`);
    }
    process.stdout.write(`Planning Forge ReqIF written: ${outPath}\n`);
  } else {
    process.stdout.write(output);
  }
}

main();
