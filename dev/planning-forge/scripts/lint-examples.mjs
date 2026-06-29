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
// names, disallowed stable-ID prefixes, and stale prompt patterns.
//
// Checks per fixture folder under <examples>:
//   1. `input.md` exists and is non-empty.
//   2. `expected-coordinator-response.md` exists and is non-empty.
//   3. Markdown code fences are balanced in every `.md` file.
//   4. Any agent name referenced in **bold** matches a known specialist name.
//   5. Any stable-ID token (e.g. FR-1) uses an allowed prefix.
//   6. Planning Forge prompts do not reintroduce forbidden tool/invocation patterns.
//   7. Critical publish path-safety text remains present.
//   8. New Planning Forge relay/carry-forward contract anchors remain present.
//   9. Agents resolve shared references from the Planning Forge plugin root.
//
// Exit codes:
//   0 = all fixtures pass
//   1 = one or more checks failed
//   2 = invalid usage or missing examples directory

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const KNOWN_AGENTS = new Set([
  'Specification Planner',
  'Architecture Planner',
  'Test Planner',
  'Prototype Spike',
  'Planning Document Publisher',
]);

const ALLOWED_ID_PREFIXES = new Set([
  'US', 'RULE', 'FR', 'NFR', 'INT', 'AC', 'EDGE', 'ASM', 'D', 'TC',
]);

const REQUIRED_FILES = ['input.md', 'expected-coordinator-response.md'];

const FORBIDDEN_PROMPT_PATTERNS = [
  {
    label: 'default implementation-agent delegation wording',
    pattern: /default\s+(?:implementation|builder)[\s-]agent|`agent` means|^\s*- \*\*agent\*\*:/mi,
  },
  {
    label: 'automatic builder invocation wording',
    pattern: /\bauto(?:matically)?[\s-]invok(?:e|es|ed|ing)\s+(?:a\s+)?(?:builder|implementation)/i,
  },
  {
    label: 'granular read/search tool identifiers',
    pattern: /\b(?:read\/readFile|search\/fileSearch|search\/listDirectory|search\/textSearch)\b/,
  },
];

const REQUIRED_AGENT_SECTIONS = [
  {
    label: 'Critical Invariants section',
    pattern: /^## Critical Invariants$/m,
  },
];

const FORBIDDEN_AGENT_ROLES = /\b(?:Builder|Implementation Agent|Coding Agent)\b/;

const SHARED_REFERENCE_AGENT_FILES = new Set([
  'planning-forge/agents/planning-forge-coordinator.agent.md',
  'planning-forge/agents/task-spec-agent.agent.md',
  'planning-forge/agents/architecture-planner.agent.md',
  'planning-forge/agents/test-planner.agent.md',
  'planning-forge/agents/prototype-spike.agent.md',
  'planning-forge/agents/planning-document-publisher.agent.md',
]);

const REQUIRED_SHARED_REFERENCE_SENTENCES = [
  'Resolve every `shared/...` reference relative to this Planning Forge plugin root: the `shared/` directory is a sibling of this agent\'s `agents/` directory.',
  'Read the resolved local file directly.',
  'If only workspace search is available, search for `planning-forge/shared/<filename>`, not bare `shared/<filename>`.',
  'Do not glob under `.copilot/installed-plugins/**` to find these local references; that is outside normal workspace search and can produce false missing-file reports.',
];

const REQUIRED_PROMPT_TEXT = [
  {
    path: ['planning-forge', 'agents', 'planning-document-publisher.agent.md'],
    label: 'publisher symlink/path safety fallback',
    pattern: /If symlink safety cannot be verified, block and ask for a non-symlink target or explicit approval\./,
  },
  {
    path: ['planning-forge', 'shared', 'coordinator-routing.md'],
    label: 'publish handoff path safety',
    pattern: /Reject targets outside the approved workspace-relative documentation directory\./,
  },
  {
    path: ['planning-forge', 'shared', 'coordinator-routing.md'],
    label: 'implementation handoff carry-forward gate',
    pattern: /Unresolved carry-forward items are resolved, explicitly non-blocking, explicitly deferred, or explicitly accepted for this handoff\./,
  },
  {
    path: ['planning-forge', 'shared', 'coordinator-routing.md'],
    label: 'implementation handoff carry-forward retention',
    pattern: /Deferred or accepted carry-forward items remain visible in session state and in the handoff prompt\./,
  },
  {
    path: ['planning-forge', 'shared', 'coordinator-routing.md'],
    label: 'implementation handoff accepted carry-forward template field',
    pattern: /Accepted or deferred carry-forward items: \{\{ACCEPTED_OR_DEFERRED_CARRY_FORWARD_ITEMS_OR_NONE\}\}/,
  },
  {
    path: [
      'dev',
      'planning-forge',
      'examples',
      '08-implementation-handoff',
      'expected-coordinator-response.md',
    ],
    label: 'implementation handoff accepted carry-forward field',
    pattern: /Accepted or deferred carry-forward items: None/,
  },
  {
    path: [
      'dev',
      'planning-forge',
      'examples',
      '10-advanced-invocation',
      'expected-coordinator-response.md',
    ],
    label: 'specialist result summary field set',
    pattern: /## Specialist Result Summary[\s\S]*Stage completed:[\s\S]*Artifact readiness:[\s\S]*Stable ID changes:[\s\S]*Carry-forward items:[\s\S]*Next recommended action:/,
  },
  {
    path: ['planning-forge', 'shared', 'session-state.md'],
    label: 'carry-forward disposition semantics',
    pattern: /disposition: unresolved\|non-blocking\|deferred\|accepted-for-handoff/,
  },
  {
    path: ['planning-forge', 'agents', 'planning-forge-coordinator.agent.md'],
    label: 'coordinator plugin-root shared reference resolution',
    pattern: /search for `planning-forge\/shared\/<filename>`, not bare `shared\/<filename>`[\s\S]*Do not glob under `\.copilot\/installed-plugins\/\*\*`/,
  },
  {
    path: ['planning-forge', 'agents', 'task-spec-agent.agent.md'],
    label: 'spec planner plugin-root shared reference resolution',
    pattern: /search for `planning-forge\/shared\/<filename>`, not bare `shared\/<filename>`[\s\S]*Do not glob under `\.copilot\/installed-plugins\/\*\*`/,
  },
  {
    path: ['planning-forge', 'agents', 'architecture-planner.agent.md'],
    label: 'architecture planner plugin-root shared reference resolution',
    pattern: /search for `planning-forge\/shared\/<filename>`, not bare `shared\/<filename>`[\s\S]*Do not glob under `\.copilot\/installed-plugins\/\*\*`/,
  },
  {
    path: ['planning-forge', 'agents', 'test-planner.agent.md'],
    label: 'test planner plugin-root shared reference resolution',
    pattern: /search for `planning-forge\/shared\/<filename>`, not bare `shared\/<filename>`[\s\S]*Do not glob under `\.copilot\/installed-plugins\/\*\*`/,
  },
  {
    path: ['planning-forge', 'agents', 'prototype-spike.agent.md'],
    label: 'prototype spike plugin-root shared reference resolution',
    pattern: /search for `planning-forge\/shared\/<filename>`, not bare `shared\/<filename>`[\s\S]*Do not glob under `\.copilot\/installed-plugins\/\*\*`/,
  },
  {
    path: ['planning-forge', 'agents', 'planning-document-publisher.agent.md'],
    label: 'publisher plugin-root shared reference resolution',
    pattern: /search for `planning-forge\/shared\/<filename>`, not bare `shared\/<filename>`[\s\S]*Do not glob under `\.copilot\/installed-plugins\/\*\*`/,
  },
];

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

function collectMdFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir).sort()) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      files.push(...collectMdFiles(path));
    } else if (entry.endsWith('.md')) {
      files.push(path);
    }
  }
  return files;
}

function frontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  return match ? match[1] : '';
}

function frontmatterAgentsBlock(metadata) {
  const lines = metadata.split('\n');
  const agentsIndex = lines.findIndex((line) => /^agents:\s*$/.test(line));
  if (agentsIndex === -1) {
    return '';
  }

  const block = [];
  for (const line of lines.slice(agentsIndex + 1)) {
    if (/^[ \t]+-[ \t]+/.test(line)) {
      block.push(line);
      continue;
    }
    if (line.trim() === '') {
      continue;
    }
    break;
  }
  return block.join('\n');
}

function checkSharedReferenceResolution(rel, text) {
  const failures = [];
  if (!SHARED_REFERENCE_AGENT_FILES.has(rel)) {
    return failures;
  }

  for (const sentence of REQUIRED_SHARED_REFERENCE_SENTENCES) {
    if (!text.includes(sentence)) {
      failures.push(`${rel}: missing shared-reference sentence: ${sentence}`);
    }
  }

  for (const [index, line] of text.split('\n').entries()) {
    const lineLabel = `${rel}:${index + 1}`;
    if (/\b(?:search|look|glob|match)[^\n]*`shared\/<filename>`/i.test(line) && !line.includes('not bare `shared/<filename>`')) {
      failures.push(`${lineLabel}: contradictory bare shared-reference search guidance`);
    }
    if (line.includes('`.copilot/installed-plugins/**`') && !line.includes('Do not glob under `.copilot/installed-plugins/**`')) {
      failures.push(`${lineLabel}: contradictory installed-plugin shared-reference search guidance`);
    }
  }

  return failures;
}

function checkPromptGuardrails(repoRoot) {
  const failures = [];
  const pluginRoot = join(repoRoot, 'planning-forge');
  const agentsRoot = join(pluginRoot, 'agents');

  for (const mdPath of collectMdFiles(pluginRoot)) {
    const rel = mdPath.slice(repoRoot.length + 1);
    const text = readFileSync(mdPath, 'utf8');
    for (const { label, pattern } of FORBIDDEN_PROMPT_PATTERNS) {
      if (pattern.test(text)) {
        failures.push(`${rel}: forbidden prompt pattern: ${label}`);
      }
    }

    if (mdPath.startsWith(`${agentsRoot}${sep}`) && mdPath.endsWith('.agent.md')) {
      failures.push(...checkSharedReferenceResolution(rel, text));

      for (const { label, pattern } of REQUIRED_AGENT_SECTIONS) {
        if (!pattern.test(text)) {
          failures.push(`${rel}: missing required agent section: ${label}`);
        }
      }

      const agentsBlock = frontmatterAgentsBlock(frontmatter(text));
      if (FORBIDDEN_AGENT_ROLES.test(agentsBlock)) {
        failures.push(`${rel}: forbidden builder-like role in agent frontmatter`);
      }
    }
  }

  for (const { path, label, pattern } of REQUIRED_PROMPT_TEXT) {
    const fullPath = join(repoRoot, ...path);
    if (!existsSync(fullPath)) {
      failures.push(`${path.join('/')}: missing required prompt file for ${label}`);
      continue;
    }
    const text = readFileSync(fullPath, 'utf8');
    if (!pattern.test(text)) {
      failures.push(`${path.join('/')}: missing required prompt text: ${label}`);
    }
  }

  return failures;
}

function main() {
  const examplesDir = parseExamplesDir(process.argv.slice(2));
  if (!existsSync(examplesDir) || !statSync(examplesDir).isDirectory()) {
    usageError(`examples directory not found: ${examplesDir}`);
  }

  const failures = [];
  const fixtureDirs = listFixtureDirs(examplesDir);
  const here = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(here, '..', '..', '..');

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

  failures.push(...checkPromptGuardrails(repoRoot));

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
