#!/usr/bin/env node
// Static lint for Model Panel instruction artifacts.
// This validates structure and guardrail anchors only; it does not evaluate model behavior.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../..');
const PLUGIN = join(ROOT, 'model-panel');
const FIXTURES = join(ROOT, 'dev/model-panel/fixtures');

const REQUIRED_PLUGIN_FILES = [
  'plugin.json',
  'README.md',
  'agents/model-panel-coordinator.agent.md',
  'agents/multi-model-review-panel.agent.md',
  'shared/run-contract.md',
  'shared/harness-adapters.md',
  'shared/format-compatibility.md',
  'shared/synthesis-policy.md',
  'shared/report-contract.md',
  'shared/model-routing-safety.md',
  'shared/review-panel.md',
];

const EXPECTED_TOOLS = new Map([
  ['agents/model-panel-coordinator.agent.md', ['read', 'search', 'agent', 'vscode/askQuestions']],
  ['agents/multi-model-review-panel.agent.md', ['read', 'search', 'agent', 'vscode/askQuestions']],
]);

const KNOWN_AGENT_NAMES = new Set([
  'Model Panel Coordinator',
  'Multi-Model Review Panel',
]);

const SHARED_REFERENCE_AGENT_FILES = new Set([
  'agents/model-panel-coordinator.agent.md',
  'agents/multi-model-review-panel.agent.md',
]);

const REQUIRED_SHARED_REFERENCE_SENTENCES = [
  'Each is a local reference in this Model Panel plugin\'s `shared/` folder (sibling of this agent\'s `agents/` directory).',
  'Resolve every `shared/...` reference from that plugin root and read the resolved local file directly.',
  'If only workspace search is available, search for `model-panel/shared/<filename>`, not bare `shared/<filename>`.',
  'Do not glob under `.copilot/installed-plugins/**` to find these local references; that is outside normal workspace search and can produce false missing-file reports.',
];

const REQUIRED_ANCHORS = [
  { file: 'agents/model-panel-coordinator.agent.md', pattern: /only the requested model route may differ/, label: 'identical packet invariant' },
  { file: 'agents/model-panel-coordinator.agent.md', pattern: /Treat the target agent as a black box/, label: 'black-box target invariant' },
  { file: 'agents/model-panel-coordinator.agent.md', pattern: /emit manual run packets instead of claiming execution/, label: 'truthful fallback' },
  { file: 'agents/multi-model-review-panel.agent.md', pattern: /delegate the actual routing, output compatibility check, raw-output preservation, and synthesis to the Model Panel Coordinator/, label: 'review delegates to coordinator' },
  { file: 'shared/run-contract.md', pattern: /same target agent, same task packet, same context/i, label: 'run contract identical packet rule' },
  { file: 'shared/harness-adapters.md', pattern: /Copilot-style hosts may expose subagent invocation plus a model selector/, label: 'copilot adapter note' },
  { file: 'shared/harness-adapters.md', pattern: /VS Code custom agent prompts may run under the currently selected conversation model/, label: 'vs code adapter note' },
  { file: 'shared/format-compatibility.md', pattern: /Format compatibility is a runtime invariant to test, not an assumption/, label: 'compatibility runtime invariant' },
  { file: 'shared/synthesis-policy.md', pattern: /Do not majority vote without evidence/, label: 'no majority vote' },
  { file: 'shared/synthesis-policy.md', pattern: /The final report must retain every raw output or cite an artifact reference/, label: 'raw output retention' },
  { file: 'shared/report-contract.md', pattern: /## Panel Status/, label: 'report panel status' },
  { file: 'shared/model-routing-safety.md', pattern: /Never claim that a model route ran unless the host returned a result/, label: 'truthful routing' },
  { file: 'shared/review-panel.md', pattern: /Preserve your normal output format unless the user supplied an explicit output contract/, label: 'review arbitrary format' },
];

const REQUIRED_SECTION_ANCHORS = [
  {
    file: 'agents/model-panel-coordinator.agent.md',
    heading: 'Critical Invariants',
    anchors: [
      { pattern: /only the requested model route may differ/, label: 'identical packet invariant' },
      { pattern: /Treat the target agent as a black box/, label: 'black-box target invariant' },
      { pattern: /Do not use Model Panel to execute mutating target-agent tasks/, label: 'mutating target-task gate' },
      { pattern: /Do not target `Model Panel Coordinator`, `Multi-Model Review Panel`/, label: 'coordinator recursion guard' },
    ],
  },
  {
    file: 'agents/model-panel-coordinator.agent.md',
    heading: 'Procedure',
    anchors: [
      { pattern: /Preflight the target agent and task/, label: 'pre-invocation target preflight' },
      { pattern: /return `blocked` for recursive target selection/, label: 'recursive target blocked in preflight' },
      { pattern: /read-only-enforced, with mutating tools absent, disabled, or sandboxed/, label: 'read-only capability preflight' },
      { pattern: /Assign one `input packet id`/, label: 'canonical packet identity' },
      { pattern: /Include raw outputs in all modes, including `raw-only`/, label: 'raw-only preserves raw outputs' },
    ],
  },
  {
    file: 'shared/run-contract.md',
    heading: 'Report-Only Target Gate',
    anchors: [
      { pattern: /must not be used to execute mutating work through a target agent/, label: 'report-only target gate' },
      { pattern: /read-only capability evidence/, label: 'target invocation read-only capability evidence' },
      { pattern: /do not rely on prompt intent alone/, label: 'no prompt-intent-only safety' },
    ],
  },
  {
    file: 'shared/run-contract.md',
    heading: 'Identical Packet Rule',
    anchors: [
      { pattern: /assign one `input packet id`/, label: 'auditable canonical packet id' },
    ],
  },
  {
    file: 'shared/run-contract.md',
    heading: 'Fallback Status Matrix',
    anchors: [
      { pattern: /Fixed-model alias agents are `partial` unless/, label: 'fixed-alias fallback status' },
      { pattern: /User-supplied raw outputs can be `completed` only when every requested output is present/, label: 'external-output completed gate' },
    ],
  },
  {
    file: 'shared/harness-adapters.md',
    heading: 'Direct Model-Selecting Agent Invocation',
    anchors: [
      { pattern: /read-only capability evidence showing mutating tools are absent, disabled, or sandboxed/, label: 'adapter read-only capability evidence' },
    ],
  },
  {
    file: 'shared/harness-adapters.md',
    heading: 'Fallback Status Matrix',
    anchors: [
      { pattern: /Fixed-model alias agents are `partial` unless/, label: 'adapter fixed-alias fallback status' },
      { pattern: /No runnable routes and no useful supplied output is `blocked`/, label: 'adapter no-output blocked status' },
    ],
  },
  {
    file: 'shared/report-contract.md',
    heading: 'Fallback Status Matrix',
    anchors: [
      { pattern: /Fixed-model alias agents are `partial` unless/, label: 'report fixed-alias fallback status' },
      { pattern: /User-supplied raw outputs can be `completed` only when every requested output is present/, label: 'report external-output completed gate' },
    ],
  },
  {
    file: 'shared/run-contract.md',
    heading: 'Panel Status',
    anchors: [
      { pattern: /distinct actual model identities or routing keys/, label: 'distinct route completion requirement' },
    ],
  },
  {
    file: 'shared/run-contract.md',
    heading: 'Model Identity',
    anchors: [
      { pattern: /cap synthesized confidence at `medium`/, label: 'collapsed route confidence cap' },
    ],
  },
  {
    file: 'shared/format-compatibility.md',
    heading: 'Structural Checks',
    anchors: [
      { pattern: /nested object shape, array item schema/, label: 'deep JSON shape check' },
      { pattern: /Treat unvalidated nested material differences as `inconclusive`/, label: 'nested mismatch inconclusive fallback' },
    ],
  },
  {
    file: 'shared/model-routing-safety.md',
    heading: 'Sensitive And Non-Disclosable Raw Outputs',
    anchors: [
      { pattern: /`hidden prompt`, `system message`, `tool internal`, or `model-private routing detail`/, label: 'non-disclosable raw-output categories' },
    ],
  },
  {
    file: 'shared/review-panel.md',
    heading: 'Target Review Agent Selection',
    anchors: [
      { pattern: /do not select `Multi-Model Review Panel` or `Model Panel Coordinator`/, label: 'review wrapper recursion guard' },
    ],
  },
];

const FORBIDDEN_PATTERNS = [
  {
    file: 'agents/model-panel-coordinator.agent.md',
    pattern: /Include raw outputs unless the user explicitly requested `raw-only`/,
    label: 'raw-only omission regression',
  },
  {
    file: 'shared/run-contract.md',
    pattern: /`completed`: at least two requested model routes succeeded/,
    label: 'ambiguous completed status regression',
  },
  {
    file: 'shared/harness-adapters.md',
    pattern: /treat model routing as `partial` and report the exact unsupported labels/,
    label: 'unsupported routing partial-blocked regression',
  },
  {
    file: 'shared/review-panel.md',
    pattern: /<dimensions or default review dimensions>/,
    label: 'undefined default review dimensions regression',
  },
];

const SECTION_SCOPE_FIXTURES = [
  {
    file: 'section-scope/positive.md',
    shouldPass: true,
    heading: 'Critical Invariants',
    anchors: [
      { pattern: /only the requested model route may differ/, label: 'normative anchor in required section' },
    ],
  },
  {
    file: 'section-scope/non-normative-anchor.md',
    shouldPass: false,
    heading: 'Critical Invariants',
    anchors: [
      { pattern: /only the requested model route may differ/, label: 'anchor outside required section should not satisfy check' },
    ],
  },
];

function normalize(text) {
  return text.replace(/\r\n?/g, '\n');
}

function readRel(path) {
  return normalize(readFileSync(join(PLUGIN, path), 'utf8'));
}

function listMarkdownFiles(dir) {
  const out = [];
  if (!existsSync(dir)) {
    errors.push(`missing directory ${dir}`);
    return out;
  }
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) out.push(...listMarkdownFiles(path));
    else if (entry.endsWith('.md')) out.push(path);
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

function withoutFencedBlocks(text) {
  const lines = [];
  let openFence = null;
  for (const line of text.split('\n')) {
    const match = line.match(/^ {0,3}(`{3,})/);
    if (match) {
      const length = match[1].length;
      if (openFence === null) {
        openFence = length;
      } else if (length >= openFence) {
        openFence = null;
      }
      continue;
    }
    if (openFence === null) lines.push(line);
  }
  return lines.join('\n');
}

function sectionText(text, heading) {
  const lines = text.split('\n');
  const headingPattern = new RegExp(`^(#{2,6})\\s+${escapeRegExp(heading)}\\s*$`);
  const start = lines.findIndex((line) => headingPattern.test(line.trim()));
  if (start === -1) return null;
  const level = lines[start].trim().match(headingPattern)[1].length;
  const out = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#{2,6})\s+/);
    if (match && match[1].length <= level) break;
    out.push(lines[index]);
  }
  return out.join('\n');
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function missingSectionAnchors(text, sectionAnchor) {
  const section = sectionText(text, sectionAnchor.heading);
  if (section === null) {
    return [`missing section ## ${sectionAnchor.heading}`];
  }
  const normative = withoutFencedBlocks(section);
  return sectionAnchor.anchors
    .filter((anchor) => !anchor.pattern.test(normative))
    .map((anchor) => `missing ${anchor.label} in ## ${sectionAnchor.heading}`);
}

function checkSharedReferenceResolution(file, text) {
  if (!SHARED_REFERENCE_AGENT_FILES.has(file)) return;

  for (const sentence of REQUIRED_SHARED_REFERENCE_SENTENCES) {
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
  const name = text.match(/^name: "([^"]+)"/m)?.[1];
  if (!KNOWN_AGENT_NAMES.has(name)) errors.push(`${file}: unknown agent name ${name || '<missing>'}`);
  checkSharedReferenceResolution(file, text);

  const tools = parseTools(text);
  if (tools.join(',') !== expectedTools.join(',')) {
    errors.push(`${file}: expected tools ${expectedTools.join(', ')} but found ${tools.join(', ')}`);
  }
  if (/^\s+-\s+(?:edit(?:\/.*)?|execute|web(?:\/.*)?)$/m.test(text)) {
    errors.push(`${file}: forbidden edit/execute/web tool`);
  }
  if (!/^user-invocable: true$/m.test(text)) {
    errors.push(`${file}: missing user-invocable true`);
  }
}

for (const anchor of REQUIRED_ANCHORS) {
  if (!existsSync(join(PLUGIN, anchor.file))) continue;
  const text = readRel(anchor.file);
  if (!anchor.pattern.test(text)) errors.push(`${anchor.file}: missing ${anchor.label}`);
}

for (const sectionAnchor of REQUIRED_SECTION_ANCHORS) {
  if (!existsSync(join(PLUGIN, sectionAnchor.file))) continue;
  const text = readRel(sectionAnchor.file);
  for (const missing of missingSectionAnchors(text, sectionAnchor)) {
    errors.push(`${sectionAnchor.file}: ${missing}`);
  }
}

for (const forbidden of FORBIDDEN_PATTERNS) {
  if (!existsSync(join(PLUGIN, forbidden.file))) continue;
  const text = readRel(forbidden.file);
  if (forbidden.pattern.test(text)) errors.push(`${forbidden.file}: forbidden ${forbidden.label}`);
}

for (const fixture of SECTION_SCOPE_FIXTURES) {
  const path = join(FIXTURES, fixture.file);
  if (!existsSync(path)) {
    errors.push(`missing fixture ${fixture.file}`);
    continue;
  }
  const text = normalize(readFileSync(path, 'utf8'));
  const missing = missingSectionAnchors(text, fixture);
  if (fixture.shouldPass && missing.length) {
    errors.push(`${fixture.file}: expected section-scope fixture to pass, got ${missing.join('; ')}`);
  }
  if (!fixture.shouldPass && !missing.length) {
    errors.push(`${fixture.file}: expected section-scope fixture to fail but it passed`);
  }
}

for (const file of listMarkdownFiles(PLUGIN)) {
  const text = normalize(readFileSync(file, 'utf8'));
  if (!balancedFences(text)) errors.push(`${file}: unbalanced code fences`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Model Panel lint passed');