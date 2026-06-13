#!/usr/bin/env node
// Check file-looking references inside generated exploration artifacts.
//
// Usage:
//   node code-explorer/scripts/check-file-references.mjs <artifact-dir> [--repo-root <path>]
//
// Scans every markdown and JSON artifact under <artifact-dir> for references
// that look like source paths (src/foo.ts, lib/bar.php, include/foo.hpp) and
// reports which ones do not exist relative to the repository root.
//
// Exit codes:
//   0 = all references resolved (or none found)
//   1 = one or more references could not be resolved
//   2 = invalid usage or missing artifact directory

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

function parseArgs(argv) {
  const args = { dir: null, repoRoot: process.cwd(), error: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--repo-root') {
      const value = argv[++i];
      if (value === undefined) {
        args.error = '--repo-root requires a value';
        break;
      }
      args.repoRoot = value;
    } else if (a.startsWith('--')) {
      args.error = `unknown flag: ${a}`;
      break;
    } else if (args.dir === null) {
      args.dir = a;
    } else {
      args.error = `unexpected argument: ${a}`;
      break;
    }
  }
  return args;
}

// A leading boundary (start-of-string or a non-path character) is matched in a
// non-capturing group rather than a lookbehind, so the pattern works on every
// Node.js runtime, not only those that support lookbehind.
const FILE_REF_RE = /(?:^|[^\w./-])((?:[\w.-]+\/)+[\w.-]+\.[a-zA-Z0-9]{1,6})/g;

function extractFileRefs(text) {
  const refs = new Set();
  let m;
  while ((m = FILE_REF_RE.exec(text)) !== null) {
    const ref = m[1];
    if (ref.startsWith('docs/codebase-exploration')) continue;
    if (ref.includes('://')) continue;
    refs.add(ref);
  }
  return [...refs];
}

function collectArtifactFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) {
      files.push(...collectArtifactFiles(p));
    } else if (entry.endsWith('.md') || entry.endsWith('.json')) {
      files.push(p);
    }
  }
  return files;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.error) {
    process.stderr.write(`Error: ${args.error}\n`);
    process.stderr.write('Usage: check-file-references.mjs <artifact-dir> [--repo-root <path>]\n');
    process.exit(2);
  }
  if (!args.dir) {
    process.stderr.write('Usage: check-file-references.mjs <artifact-dir> [--repo-root <path>]\n');
    process.exit(2);
  }
  const artifactDir = resolve(args.dir);
  if (!existsSync(artifactDir) || !statSync(artifactDir).isDirectory()) {
    process.stderr.write(`Error: artifact directory not found: ${artifactDir}\n`);
    process.exit(2);
  }
  const repoRoot = resolve(args.repoRoot);

  const refToSources = new Map();
  for (const file of collectArtifactFiles(artifactDir)) {
    const text = readFileSync(file, 'utf8');
    for (const ref of extractFileRefs(text)) {
      if (!refToSources.has(ref)) refToSources.set(ref, new Set());
      refToSources.get(ref).add(relative(artifactDir, file));
    }
  }

  const resolved = [];
  const missing = [];
  for (const [ref, sources] of refToSources) {
    if (existsSync(resolve(repoRoot, ref))) resolved.push(ref);
    else missing.push({ ref, sources: [...sources] });
  }

  process.stdout.write(`File reference check (repo root: ${relative(process.cwd(), repoRoot) || '.'})\n\n`);
  process.stdout.write(`Resolved: ${resolved.length}\n`);
  process.stdout.write(`Unresolved: ${missing.length}\n`);
  if (missing.length > 0) {
    process.stdout.write('\nUnresolved references:\n');
    for (const { ref, sources } of missing) {
      process.stdout.write(`- ${ref}  (in ${sources.join(', ')})\n`);
    }
  }
  process.exit(missing.length > 0 ? 1 : 0);
}

main();
