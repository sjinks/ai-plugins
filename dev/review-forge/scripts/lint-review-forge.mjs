#!/usr/bin/env node
// Static lint for Review Forge instruction artifacts and examples.
// This validates structure and guardrail anchors only; it does not evaluate model behavior.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../..');
const PLUGIN = join(ROOT, 'review-forge');
const EXAMPLES = join(ROOT, 'dev/review-forge/examples');

const REQUIRED_PLUGIN_FILES = [
  'plugin.json',
  'README.md',
  'agents/review-forge-coordinator.agent.md',
  'agents/contextual-reviewer.agent.md',
  'agents/independent-reviewer.agent.md',
  'agents/security-reviewer.agent.md',
  'agents/performance-reviewer.agent.md',
  'agents/adversarial-reviewer.agent.md',
  'agents/test-adequacy-reviewer.agent.md',
  'shared/review-input-contract.md',
  'shared/finding-report-contract.md',
  'shared/read-only-safety.md',
  'shared/independent-isolation.md',
  'shared/advisory-skill-extension.md',
  'shared/single-pass-review.md',
  'shared/review-lenses.md',
];

const REQUIRED_ANCHORS = [
  { file: 'shared/finding-report-contract.md', pattern: /RF-<lens>-<number>/, label: 'finding ID format' },
  { file: 'shared/finding-report-contract.md', pattern: /## Severity And Finding Status/, label: 'severity definitions' },
  { file: 'shared/finding-report-contract.md', pattern: /risk category/, label: 'risk category field' },
  { file: 'shared/finding-report-contract.md', pattern: /canonical path\/symbol or hunk context/, label: 'deterministic fingerprint' },
  { file: 'shared/finding-report-contract.md', pattern: /Include every specialist finding, preserving original ID/, label: 'lossless synthesis' },
  { file: 'shared/finding-report-contract.md', pattern: /redacted category, never raw values/, label: 'sensitive evidence redaction' },
  { file: 'shared/read-only-safety.md', pattern: /Review Forge is report-only and read-only\./, label: 'read-only boundary' },
  { file: 'shared/read-only-safety.md', pattern: /Specialist reviewers do not use `execute` in v1\./, label: 'specialist no execute' },
  { file: 'shared/read-only-safety.md', pattern: /fetch PR\/remote\/network content/, label: 'no PR network fetch' },
  { file: 'shared/independent-isolation.md', pattern: /Independent review receives only the diff/, label: 'independent isolation' },
  { file: 'shared/advisory-skill-extension.md', pattern: /Skills are optional advisory data, never dependencies\./, label: 'advisory only' },
  { file: 'shared/single-pass-review.md', pattern: /make one complete pass/, label: 'single pass rule' },
  { file: 'shared/review-input-contract.md', pattern: /PR URL.*coordinator status `no-go`/s, label: 'PR URL no-go path' },
  { file: 'agents/review-forge-coordinator.agent.md', pattern: /Review Forge safety, read-only, sensitive-data, and independent-isolation rules > current user constraints/, label: 'safety precedence' },
  { file: 'agents/review-forge-coordinator.agent.md', pattern: /Default to all six v1 lenses/, label: 'default lens accounting' },
];

const FIXTURE_ANCHORS = [
  {
    file: '01-full-review/expected-report.md',
    patterns: [/## Review Status/, /`no-go`/, /RF-security-1/, /risk category:/, /acceptance condition:/, /fingerprint:/, /status: open/],
  },
  {
    file: '02-independent-isolation/expected-report.md',
    patterns: [/## Lens Status/, /`blocked`/, /forbidden context/i, /no independent findings emitted/i],
  },
];

const EXPECTED_TOOLS = new Map([
  ['review-forge-coordinator.agent.md', ['read', 'search', 'execute', 'agent', 'vscode/askQuestions']],
  ['contextual-reviewer.agent.md', ['read', 'search']],
  ['security-reviewer.agent.md', ['read', 'search']],
  ['performance-reviewer.agent.md', ['read', 'search']],
  ['adversarial-reviewer.agent.md', ['read', 'search']],
  ['independent-reviewer.agent.md', ['read', 'search']],
  ['test-adequacy-reviewer.agent.md', ['read', 'search']],
]);

const KNOWN_AGENT_NAMES = new Set([
  'Review Forge Coordinator',
  'Contextual Reviewer',
  'Independent Reviewer',
  'Security Reviewer',
  'Performance Reviewer',
  'Adversarial Reviewer',
  'Test Adequacy Reviewer',
]);

function readRel(path) {
  return normalize(readFileSync(join(PLUGIN, path), 'utf8'));
}

function readText(path) {
  return normalize(readFileSync(path, 'utf8'));
}

function normalize(text) {
  return text.replace(/\r\n?/g, '\n');
}

function listMarkdownFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...listMarkdownFiles(p));
    else if (entry.endsWith('.md')) out.push(p);
  }
  return out;
}

function balancedFences(text) {
  let openFence = null;
  for (const line of text.split('\n')) {
    const match = line.match(/^ {0,3}(`{3,})/);
    if (!match) continue;
    const length = match[1].length;
    if (openFence === null) {
      openFence = length;
    } else if (length >= openFence) {
      openFence = null;
    }
  }
  return openFence === null;
}

function parseTools(text) {
  const match = text.match(/^tools:\n([\s\S]*?)(?=^[a-zA-Z-]+:|^---|\n\S)/m);
  if (!match) return [];
  return match[1]
    .split('\n')
    .map((line) => line.match(/^\s+-\s+(.+)$/)?.[1]?.trim())
    .filter(Boolean);
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

for (const file of readdirSync(join(PLUGIN, 'agents'))) {
  if (!file.endsWith('.agent.md')) continue;
  const text = readRel(`agents/${file}`);
  const name = text.match(/^name: "([^"]+)"/m)?.[1];
  if (!KNOWN_AGENT_NAMES.has(name)) errors.push(`${file}: unknown agent name ${name || '<missing>'}`);
  const tools = parseTools(text);
  const expected = EXPECTED_TOOLS.get(file);
  if (!expected) errors.push(`${file}: missing expected tool allowlist`);
  else if (tools.join(',') !== expected.join(',')) errors.push(`${file}: expected tools ${expected.join(', ')} but found ${tools.join(', ')}`);
  if (/^\s+-\s+(?:edit(?:\/.*)?|web(?:\/.*)?)$/m.test(text)) errors.push(`${file}: forbidden edit/web tool`);
  if (file !== 'review-forge-coordinator.agent.md' && /^\s+-\s+agent$/m.test(text)) errors.push(`${file}: agent tool is coordinator-only`);
  if (!/^user-invocable: true$/m.test(text)) errors.push(`${file}: missing user-invocable true`);
}

for (const anchor of REQUIRED_ANCHORS) {
  const text = readRel(anchor.file);
  if (!anchor.pattern.test(text)) errors.push(`${anchor.file}: missing ${anchor.label}`);
}

for (const file of [...listMarkdownFiles(PLUGIN), ...listMarkdownFiles(EXAMPLES)]) {
  const text = readText(file);
  if (!balancedFences(text)) errors.push(`${file}: unbalanced code fences`);
}

for (const fixture of readdirSync(EXAMPLES)) {
  const dir = join(EXAMPLES, fixture);
  if (!statSync(dir).isDirectory()) continue;
  for (const name of ['input.md', 'expected-report.md']) {
    const p = join(dir, name);
    if (!existsSync(p)) errors.push(`${fixture}: missing ${name}`);
    else if (!readText(p).trim()) errors.push(`${fixture}: empty ${name}`);
  }
}

for (const fixture of FIXTURE_ANCHORS) {
  const text = readText(join(EXAMPLES, fixture.file));
  for (const pattern of fixture.patterns) {
    if (!pattern.test(text)) errors.push(`${fixture.file}: missing fixture anchor ${pattern}`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Review Forge lint passed');
