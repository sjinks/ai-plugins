#!/usr/bin/env node
// Static lint for Code Smith instruction artifacts.
// This validates structure and guardrail anchors only; it does not evaluate model behavior.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../..');
const PLUGIN = join(ROOT, 'code-smith');

const REQUIRED_PLUGIN_FILES = [
  'plugin.json',
  'README.md',
  'agents/code-smith.agent.md',
  'agents/test-smith.agent.md',
  'shared/handoff-contract.md',
  'shared/command-safety.md',
  'shared/self-review-checklist.md',
  'shared/completion-report.md',
  'shared/verification-input-contract.md',
  'shared/verification-command-safety.md',
  'shared/verification-execution.md',
  'shared/verification-report.md',
];

const EXPECTED_TOOLS = new Map([
  [
    'agents/code-smith.agent.md',
    ['read', 'search', 'execute', 'edit/createDirectory', 'edit/createFile', 'edit/editFiles', 'vscode/askQuestions'],
  ],
  ['agents/test-smith.agent.md', ['read', 'search', 'execute', 'vscode/askQuestions']],
]);

const REQUIRED_ANCHORS = [
  {
    file: 'agents/code-smith.agent.md',
    pattern: /search for `code-smith\/shared\/<filename>`, not bare `shared\/<filename>`[\s\S]*Do not glob under `\.copilot\/installed-plugins\/\*\*`/,
    label: 'code smith plugin-root shared reference resolution',
  },
  {
    file: 'agents/test-smith.agent.md',
    pattern: /search for `code-smith\/shared\/<filename>`, not bare `shared\/<filename>`[\s\S]*Do not glob under `\.copilot\/installed-plugins\/\*\*`/,
    label: 'test smith plugin-root shared reference resolution',
  },
  {
    file: 'agents/code-smith.agent.md',
    pattern: /Refuse outright .* create branches, stage, commit, push, rewrite history, open pull requests, deploy, or change production state/s,
    label: 'code smith no git or deploy mutation',
  },
  {
    file: 'agents/test-smith.agent.md',
    pattern: /Do not write, create, delete, move, or update code, tests, fixtures, snapshots, config, dependency files, or generated artifacts\./,
    label: 'test smith no-edit boundary',
  },
];

const SHARED_REFERENCE_AGENT_FILES = new Set([
  'agents/code-smith.agent.md',
  'agents/test-smith.agent.md',
]);

const REQUIRED_SHARED_REFERENCE_SENTENCES = [
  'Resolve every `shared/...` reference from that plugin root and read the resolved local file directly.',
  'If only workspace search is available, search for `code-smith/shared/<filename>`, not bare `shared/<filename>`.',
  'Do not glob under `.copilot/installed-plugins/**` to find these local references; that is outside normal workspace search and can produce false missing-file reports.',
];

function readRel(path) {
  return readFileSync(join(PLUGIN, path), 'utf8').replace(/\r\n?/g, '\n');
}

function parseTools(text) {
  const match = text.match(/^tools:\n([\s\S]*?)(?=^[a-zA-Z-]+:|^---|\n\S)/m);
  if (!match) return [];
  return match[1]
    .split('\n')
    .map((line) => line.match(/^\s+-\s+(.+)$/)?.[1]?.trim())
    .filter(Boolean);
}

function checkSharedReferenceResolution(file, text) {
  if (!SHARED_REFERENCE_AGENT_FILES.has(file)) return;

  const localReferenceSentence = file === 'agents/code-smith.agent.md'
    ? 'Each is a local reference in this Code Smith plugin\'s `shared/` folder (sibling of this agent\'s `agents/` directory).'
    : 'Each is in this Code Smith plugin\'s `shared/` folder (sibling of this agent\'s `agents/` directory).';

  for (const sentence of [localReferenceSentence, ...REQUIRED_SHARED_REFERENCE_SENTENCES]) {
    if (!text.includes(sentence)) errors.push(`${file}: missing shared-reference sentence: ${sentence}`);
  }

  for (const [index, line] of text.split('\n').entries()) {
    const lineLabel = `${file}:${index + 1}`;
    if (/\b(?:search|look|glob|match)[^\n]*`shared\/<filename>`/i.test(line) && !line.includes('not bare `shared/<filename>`')) {
      errors.push(`${lineLabel}: contradictory bare shared-reference search guidance`);
    }
    if (line.includes('`.copilot/installed-plugins/**`') && !line.includes('Do not glob under `.copilot/installed-plugins/**`')) {
      errors.push(`${lineLabel}: contradictory installed-plugin shared-reference search guidance`);
    }
  }
}

const errors = [];

for (const file of REQUIRED_PLUGIN_FILES) {
  if (!existsSync(join(PLUGIN, file))) errors.push(`missing ${file}`);
}

try {
  JSON.parse(readRel('plugin.json'));
} catch (error) {
  errors.push(`plugin.json invalid: ${error.message}`);
}

for (const [file, expectedTools] of EXPECTED_TOOLS) {
  if (!existsSync(join(PLUGIN, file))) continue;
  const text = readRel(file);
  checkSharedReferenceResolution(file, text);
  const tools = parseTools(text);
  if (tools.join(',') !== expectedTools.join(',')) {
    errors.push(`${file}: expected tools ${expectedTools.join(', ')} but found ${tools.join(', ')}`);
  }
  if (!/^user-invocable: true$/m.test(text)) {
    errors.push(`${file}: missing user-invocable true`);
  }
}

for (const anchor of REQUIRED_ANCHORS) {
  if (!existsSync(join(PLUGIN, anchor.file))) continue;
  const text = readRel(anchor.file);
  if (!anchor.pattern.test(text)) {
    errors.push(`${anchor.file}: missing ${anchor.label}`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Code Smith lint passed');
