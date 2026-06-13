#!/usr/bin/env node
// Validate expected fixture outputs against the artifact schemas.
//
// Usage:
//   node code-explorer/tests/validate-fixtures.mjs
//
// Locates every fixture under code-explorer/fixtures/*/expected/docs/codebase-exploration
// and runs validate-artifacts.mjs against it. The repo root for file-reference
// checks is the fixture root (code-explorer/fixtures/<name>), so fixture source
// paths like src/routes.js resolve.
//
// Does NOT run an AI agent. Exit code is 0 only if every fixture validates.

import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const TESTS_DIR = dirname(fileURLToPath(import.meta.url));
const PLUGIN_DIR = resolve(TESTS_DIR, '..');
const FIXTURES_DIR = join(PLUGIN_DIR, 'fixtures');
const VALIDATOR = join(PLUGIN_DIR, 'scripts', 'validate-artifacts.mjs');

function findExpectedDirs() {
  const dirs = [];
  if (!existsSync(FIXTURES_DIR)) return dirs;
  for (const fixture of readdirSync(FIXTURES_DIR)) {
    const fixtureRoot = join(FIXTURES_DIR, fixture);
    const expected = join(fixtureRoot, 'expected', 'docs', 'codebase-exploration');
    if (existsSync(expected) && statSync(expected).isDirectory()) {
      dirs.push({ fixture, dir: expected, repoRoot: fixtureRoot });
    }
  }
  return dirs;
}

function main() {
  const fixtures = findExpectedDirs();
  if (fixtures.length === 0) {
    process.stdout.write('No fixtures with expected artifacts found.\n');
    process.exit(0);
  }

  let failures = 0;
  for (const { fixture, dir, repoRoot } of fixtures) {
    process.stdout.write(`\n=== Fixture: ${fixture} ===\n`);
    const res = spawnSync(
      process.execPath,
      [VALIDATOR, dir, '--strict', '--repo-root', repoRoot],
      { encoding: 'utf8' },
    );
    process.stdout.write(res.stdout || '');
    if (res.stderr) process.stderr.write(res.stderr);
    if (res.error) {
      // The validator process could not be spawned at all.
      failures++;
      process.stdout.write(`Fixture ${fixture}: FAIL (could not run validator: ${res.error.message})\n`);
    } else if (res.signal) {
      // The validator was terminated by a signal (status is null in this case).
      failures++;
      process.stdout.write(`Fixture ${fixture}: FAIL (validator terminated by signal ${res.signal})\n`);
    } else if (res.status !== 0) {
      failures++;
      process.stdout.write(`Fixture ${fixture}: FAIL (exit ${res.status})\n`);
    } else {
      process.stdout.write(`Fixture ${fixture}: PASS\n`);
    }
  }

  process.stdout.write(`\n${fixtures.length - failures}/${fixtures.length} fixture(s) passed.\n`);
  process.exit(failures > 0 ? 1 : 0);
}

main();
