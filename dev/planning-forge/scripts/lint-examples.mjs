#!/usr/bin/env node
// Static structural lint for Planning Forge Coordinator example fixtures.
//
// Usage:
//   node planning-forge/scripts/lint-examples.mjs [--examples <dir>]
//
// This is a static check only. It does NOT run the Coordinator or assert on
// model behavior (agent-prompt behavior is non-deterministic; that harness is
// deliberately out of scope — see spec OQ-3). It catches the class of issues
// that recurred in review: missing files, unbalanced fences, unknown agent
// names, and disallowed stable-ID prefixes.
//
// Checks per fixture folder under <examples>:
//   1. `input.md` exists and is non-empty.
//   2. `expected-coordinator-response.md` exists and is non-empty.
//   3. Markdown code fences are balanced in every `.md` file.
//   4. Any agent name referenced in **bold** matches a known specialist name.
//   5. Any stable-ID token (e.g. FR-1) uses an allowed prefix.
//
// Exit codes:
//   0 = all fixtures pass
//   1 = one or more checks failed
//   2 = invalid usage or missing examples directory

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const KNOWN_AGENTS = new Set([
  'Specification Planner',
  'Architecture Planner',
  'Test Planner',
  'Prototype Spike',
  'Planning Document Publisher',
]);

const ALLOWED_ID_PREFIXES = new Set([
  'US', 'FR', 'NFR', 'INT', 'AC', 'EDGE', 'ASM', 'D', 'TC',
]);

const REQUIRED_FILES = ['input.md', 'expected-coordinator-response.md'];

function parseExamplesDir(argv) {
  const idx = argv.indexOf('--examples');
  if (idx !== -1) {
    const value = argv[idx + 1];
    if (!value) {
      usageError('--examples requires a directory path');
    }
    return resolve(value);
  }
  // Default: the examples/ dir next to this script's plugin root.
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, '..', 'examples');
}

function usageError(message) {
  process.stderr.write(`error: ${message}\n`);
  process.stderr.write(
    'usage: node planning-forge/scripts/lint-examples.mjs [--examples <dir>]\n',
  );
  process.exit(2);
}

// Count fence markers grouped by backtick length. A file passes when every
// distinct fence length appears an even number of times (each opener has a
// matching closer of the same length). This does not validate nesting order,
// only per-length parity.
function fenceImbalance(text) {
  const counts = new Map();
  for (const line of text.split('\n')) {
    // CommonMark allows a fenced code block to be indented by up to 3 spaces.
    const match = /^ {0,3}(`{3,})/.exec(line);
    if (match) {
      const len = match[1].length;
      counts.set(len, (counts.get(len) ?? 0) + 1);
    }
  }
  const odd = [];
  for (const [len, count] of counts) {
    if (count % 2 !== 0) {
      odd.push(`${'`'.repeat(len)} x${count}`);
    }
  }
  return odd;
}

function checkAgentNames(text) {
  const problems = [];
  // Bold tokens like **Architecture Planner** are how fixtures name the
  // routing target. Flag any bold token that looks like an agent name but is
  // not in the known set. Heuristic: title-case multi-word ending in a known
  // role word.
  const ROLE_WORD = /(?:Planner|Spike|Publisher)$/;
  const boldRe = /\*\*([A-Z][\w ]+?)\*\*/g;
  let m;
  while ((m = boldRe.exec(text)) !== null) {
    const name = m[1].trim();
    if (ROLE_WORD.test(name) && !KNOWN_AGENTS.has(name)) {
      problems.push(name);
    }
  }
  return problems;
}

function checkIdPrefixes(text) {
  const problems = new Set();
  const idRe = /\b([A-Z]{1,5})-\d+\b/g;
  let m;
  while ((m = idRe.exec(text)) !== null) {
    const prefix = m[1];
    // Q- and RISK- are intentionally NOT emitted as stable IDs.
    if (!ALLOWED_ID_PREFIXES.has(prefix)) {
      problems.add(`${prefix}-`);
    }
  }
  return [...problems];
}

function listFixtureDirs(examplesDir) {
  return readdirSync(examplesDir)
    .map((name) => join(examplesDir, name))
    .filter((path) => statSync(path).isDirectory())
    .sort();
}

function mdFilesIn(dir) {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => join(dir, name));
}

function main() {
  const examplesDir = parseExamplesDir(process.argv.slice(2));
  if (!existsSync(examplesDir) || !statSync(examplesDir).isDirectory()) {
    usageError(`examples directory not found: ${examplesDir}`);
  }

  const failures = [];
  const fixtureDirs = listFixtureDirs(examplesDir);

  for (const dir of fixtureDirs) {
    const rel = dir.slice(examplesDir.length + 1);

    for (const required of REQUIRED_FILES) {
      const path = join(dir, required);
      if (!existsSync(path) || readFileSync(path, 'utf8').trim() === '') {
        failures.push(`${rel}: missing or empty ${required}`);
      }
    }

    for (const mdPath of mdFilesIn(dir)) {
      const text = readFileSync(mdPath, 'utf8');
      const name = mdPath.slice(dir.length + 1);

      const odd = fenceImbalance(text);
      if (odd.length > 0) {
        failures.push(`${rel}/${name}: unbalanced code fences (${odd.join(', ')})`);
      }

      const badAgents = checkAgentNames(text);
      if (badAgents.length > 0) {
        failures.push(`${rel}/${name}: unknown agent name(s): ${badAgents.join(', ')}`);
      }

      const badIds = checkIdPrefixes(text);
      if (badIds.length > 0) {
        failures.push(
          `${rel}/${name}: disallowed stable-ID prefix(es): ${badIds.join(', ')}`,
        );
      }
    }
  }

  if (failures.length > 0) {
    process.stderr.write('Planning Forge example lint FAILED:\n');
    for (const failure of failures) {
      process.stderr.write(`  - ${failure}\n`);
    }
    process.exit(1);
  }

  process.stdout.write(
    `Planning Forge example lint passed: ${fixtureDirs.length} fixtures OK\n`,
  );
}

main();
