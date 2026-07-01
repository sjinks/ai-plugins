#!/usr/bin/env node
// Export a validated Planning Forge metamodel artifact to an OSLC RDF/XML
// document.
//
// This is a one-way publish: it serializes the canonical JSON/YAML model into
// OSLC resources for ALM/OSLC tools. It does not import RDF back. The JSON/YAML
// artifact remains the source of truth; run validate-metamodel.mjs first.
//
// Usage:
//   node dev/planning-forge/scripts/export-metamodel-oslc.mjs <artifact.(json|yaml|yml)> [--base <iri-prefix>] [--out <file>]
//
// Exit codes:
//   0 = OSLC RDF/XML written (stdout or --out file)
//   2 = invalid usage, missing/unparseable artifact, or unwritable output

import { existsSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from '../../../code-explorer/scripts/lib/cli.mjs';
import { loadArtifact } from './lib/artifact.mjs';
import { buildOslc } from './lib/oslc.mjs';

const ARG_SPEC = {
  positionals: [{ name: 'artifact', required: true }],
  flags: {
    '--base': { type: 'value', default: '' },
    '--out': { type: 'value', default: '' },
  },
};

function usageError(message) {
  process.stderr.write(`error: ${message}\n`);
  process.stderr.write(
    'usage: node dev/planning-forge/scripts/export-metamodel-oslc.mjs <artifact.(json|yaml|yml)> [--base <iri-prefix>] [--out <file>]\n',
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
  // The base is concatenated with node ids to form rdf:about/rdf:resource IRIs.
  // Reject characters that are illegal in an IRI reference so the output is a
  // valid IRI, not just well-formed XML (attribute escaping already prevents
  // any breakout, but cannot make an invalid IRI valid).
  if (args.base && /[\s<>"{}|\\^`]/.test(args.base)) {
    usageError('`--base` must be a valid IRI prefix (no spaces or <>"{}|\\^` characters)');
  }

  let output;
  try {
    output = buildOslc(artifact, args.base ? { base: args.base } : {});
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
    process.stdout.write(`Planning Forge OSLC written: ${outPath}\n`);
  } else {
    process.stdout.write(output);
  }
}

main();
