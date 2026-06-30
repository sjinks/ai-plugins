#!/usr/bin/env node
// Smoke tests for the Planning Forge metamodel view tooling: YAML loader,
// validator YAML support, views generator, and completeness report.

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseYaml } from './lib/yaml.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const VALIDATOR = resolve(SCRIPT_DIR, 'validate-metamodel.mjs');
const GENERATOR = resolve(SCRIPT_DIR, 'generate-metamodel-views.mjs');
const COMPLETENESS = resolve(SCRIPT_DIR, 'metamodel-completeness.mjs');
const FIXTURES = resolve(SCRIPT_DIR, '../fixtures/metamodel');

let passed = 0;

function run(script, args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  passed++;
}

function expectRun(label, script, args, expectedStatus, expectedText) {
  const result = run(script, args);
  const output = `${result.stdout}\n${result.stderr}`;
  if (result.status !== expectedStatus) {
    throw new Error(`${label}: expected exit ${expectedStatus}, got ${result.status}\n${output}`);
  }
  if (expectedText && !output.includes(expectedText)) {
    throw new Error(`${label}: expected output to include ${JSON.stringify(expectedText)}\n${output}`);
  }
  passed++;
  return output;
}

function expectThrow(fn, label) {
  let threw = false;
  try {
    fn();
  } catch {
    threw = true;
  }
  assert(threw, label);
}

function testYamlParser() {
  const value = parseYaml('a: 1\nb:\n  - x\n  - y: 2\nc: "1.1"\n');
  assert(value.a === 1, 'yaml: integer scalar');
  assert(Array.isArray(value.b) && value.b[0] === 'x', 'yaml: sequence scalar');
  assert(value.b[1].y === 2, 'yaml: nested mapping item');
  assert(value.c === '1.1', 'yaml: quoted string stays string');

  // Single-quote escaping, flow collections, null/bool, and nested block
  // sequences under a mapping key (the evidence/impact shape).
  const rich = parseYaml(
    [
      "single: 'it''s fine'",
      'flowList: ["a", "b"]',
      'flowObj: { "k": 1 }',
      'maybe: null',
      'flag: true',
      'parent:',
      '  - kind: file',
      '    ref: a/b.ts',
      '',
    ].join('\n'),
  );
  assert(rich.single === "it's fine", 'yaml: single-quote escaping');
  assert(Array.isArray(rich.flowList) && rich.flowList[1] === 'b', 'yaml: flow list');
  assert(rich.flowObj.k === 1, 'yaml: flow object');
  assert(rich.maybe === null, 'yaml: null scalar');
  assert(rich.flag === true, 'yaml: boolean scalar');
  assert(rich.parent[0].kind === 'file' && rich.parent[0].ref === 'a/b.ts', 'yaml: nested block sequence under key');

  // Empty / comment-only documents parse to null rather than throwing.
  assert(parseYaml('# only a comment\n') === null, 'yaml: comment-only document');

  expectThrow(() => parseYaml('a:\n\tb: 1\n'), 'yaml: tabs rejected');
  expectThrow(() => parseYaml('status: must\nstatus: should\n'), 'yaml: duplicate key rejected');
}

function testYamlRoundTrip() {
  // The YAML fixture and an equivalent JSON object must produce the same shape.
  const yamlArtifact = parseYaml(
    [
      'schema_version: "1.1"',
      'artifact_type: test_plan',
      'nodes:',
      '  - id: ASM-1',
      '    type: assumption',
      '    claim_kind: assumption',
      '    title: A',
      '    statement: S.',
      '    status: unconfirmed',
      '    source: inferred-from-repository',
      '    evidence:',
      '      - kind: file',
      '        ref: a/b.ts',
      '    confidence: low',
      '    impact_if_false:',
      '      - TC-1 budget',
      'edges: []',
      '',
    ].join('\n'),
  );
  const jsonArtifact = {
    schema_version: '1.1',
    artifact_type: 'test_plan',
    nodes: [
      {
        id: 'ASM-1',
        type: 'assumption',
        claim_kind: 'assumption',
        title: 'A',
        statement: 'S.',
        status: 'unconfirmed',
        source: 'inferred-from-repository',
        evidence: [{ kind: 'file', ref: 'a/b.ts' }],
        confidence: 'low',
        impact_if_false: ['TC-1 budget'],
      },
    ],
    edges: [],
  };
  assert(
    JSON.stringify(yamlArtifact) === JSON.stringify(jsonArtifact),
    'yaml: provenance round-trips to the JSON shape',
  );
}

function testValidatorYaml(tempDir) {
  // YAML and JSON forms of the same artifact validate identically.
  expectRun('validate yaml fixture', VALIDATOR, [join(FIXTURES, 'test-plan.yaml')], 0, 'validation passed');

  const badYaml = join(tempDir, 'bad.yaml');
  writeFileSync(badYaml, 'schema_version: "1.1"\nartifact_type: test_plan\nnodes: []\nedges: []\n');
  expectRun('validate yaml empty nodes', VALIDATOR, [badYaml], 1, 'array shorter than minItems');
}

function testGenerator(tempDir) {
  const out = expectRun('generate matrix', GENERATOR, [join(FIXTURES, 'minimal-planning-bundle.json'), '--view', 'matrix'], 0, '## Traceability Matrix');
  assert(out.includes('| FR-1 | `verified_by` | TC-1 |'), 'generator: matrix row present');
  assert(!out.includes('## Diagram'), 'generator: matrix view omits diagram');

  const mermaid = expectRun('generate mermaid', GENERATOR, [join(FIXTURES, 'specification.json'), '--view', 'mermaid'], 0, '```mermaid');
  assert(mermaid.includes('-- refines -->'), 'generator: mermaid edge present');

  const outFile = join(tempDir, 'view.md');
  expectRun('generate to file', GENERATOR, [join(FIXTURES, 'architecture.json'), '--view', 'all', '--out', outFile], 0, 'view written');

  expectRun('generate unknown view', GENERATOR, [join(FIXTURES, 'architecture.json'), '--view', 'nope'], 2, 'unknown view');

  // External labels with quotes/brackets must not break Mermaid or Markdown.
  const tricky = {
    schema_version: '1.1',
    artifact_type: 'planning_bundle',
    nodes: [
      { id: 'D-1', type: 'architecture_decision', claim_kind: 'decision', title: 'Guard | redirect [x]', statement: 'S.', status: 'proposed' },
    ],
    edges: [{ source: 'D-1', relationship: 'mitigates', target: 'risk: leak via "redirect" [x]' }],
  };
  const trickyFile = join(tempDir, 'tricky.json');
  writeFileSync(trickyFile, JSON.stringify(tricky, null, 2));
  const trickyOut = expectRun('generate tricky labels', GENERATOR, [trickyFile, '--view', 'all'], 0, '## Diagram');
  assert(!trickyOut.includes('["risk: leak via "redirect" [x]"]'), 'generator: mermaid label neutralizes quotes/brackets');
  assert(trickyOut.includes('#quot;'), 'generator: mermaid uses entity escaping for quotes');
  assert(trickyOut.includes('Guard \\| redirect'), 'generator: markdown cell escapes pipe');

  // A dangling stable-ID edge source still appears in the matrix (not dropped).
  const dangling = {
    schema_version: '1.1',
    artifact_type: 'planning_bundle',
    nodes: [
      { id: 'AC-1', type: 'acceptance_criterion', claim_kind: 'verification', title: 'AC', statement: 'S.', status: 'approved' },
    ],
    edges: [{ source: 'FR-9', relationship: 'demonstrated_by', target: 'AC-1' }],
  };
  const danglingFile = join(tempDir, 'dangling.json');
  writeFileSync(danglingFile, JSON.stringify(dangling, null, 2));
  const danglingOut = expectRun('generate dangling source', GENERATOR, [danglingFile, '--view', 'matrix'], 0, '## Traceability Matrix');
  assert(danglingOut.includes('| FR-9 | `demonstrated_by` | AC-1 |'), 'generator: matrix keeps edges with nodeless sources');
}

function testCompleteness(tempDir) {
  for (const fixture of ['specification.json', 'architecture.json', 'test-plan.yaml', 'minimal-planning-bundle.json']) {
    expectRun(`completeness ${fixture}`, COMPLETENESS, [join(FIXTURES, fixture)], 0, 'completeness passed');
  }

  // A test plan missing a verified_by edge fails with an error.
  const gap = {
    schema_version: '1.1',
    artifact_type: 'test_plan',
    nodes: [
      { id: 'AC-1', type: 'acceptance_criterion', claim_kind: 'verification', title: 'AC', statement: 'Observable.', status: 'approved' },
      { id: 'TC-1', type: 'test_case', claim_kind: 'verification', title: 'TC', statement: 'Verify.', status: 'approved' },
    ],
    edges: [],
  };
  const gapFile = join(tempDir, 'gap.json');
  writeFileSync(gapFile, JSON.stringify(gap, null, 2));
  expectRun('completeness gap error', COMPLETENESS, [gapFile], 1, 'AC-1: no verified_by edge');

  // Same gap is only a warning surface when nothing is strict; deferred AC is skipped.
  const deferred = JSON.parse(JSON.stringify(gap));
  deferred.nodes[0].status = 'deferred';
  const deferredFile = join(tempDir, 'deferred.json');
  writeFileSync(deferredFile, JSON.stringify(deferred, null, 2));
  expectRun('completeness deferred skipped', COMPLETENESS, [deferredFile], 0, 'completeness passed');

  // An assumption without impact_if_false is an error even without the validator.
  const asm = {
    schema_version: '1.1',
    artifact_type: 'specification',
    nodes: [
      { id: 'ASM-1', type: 'assumption', claim_kind: 'assumption', title: 'A', statement: 'S.', status: 'unconfirmed', source: 'user-stated', confidence: 'low' },
    ],
    edges: [],
  };
  const asmFile = join(tempDir, 'asm.json');
  writeFileSync(asmFile, JSON.stringify(asm, null, 2));
  expectRun('completeness assumption impact', COMPLETENESS, [asmFile], 1, 'ASM-1: assumption has no impact_if_false');

  // A `may` FR with no demonstrated_by is a warning, not an error: passes by
  // default but fails under --strict.
  const mayReq = {
    schema_version: '1.1',
    artifact_type: 'specification',
    nodes: [
      { id: 'FR-1', type: 'functional_requirement', claim_kind: 'requirement', title: 'Optional', statement: 'MAY do X.', obligation: 'may', status: 'approved' },
    ],
    edges: [],
  };
  const mayFile = join(tempDir, 'may.json');
  writeFileSync(mayFile, JSON.stringify(mayReq, null, 2));
  expectRun('completeness may warning default', COMPLETENESS, [mayFile], 0, 'completeness passed');
  expectRun('completeness may warning strict', COMPLETENESS, [mayFile, '--strict'], 1, 'no demonstrated_by edge');

  // impact_if_false referencing an unknown node is a warning.
  const danglingImpact = {
    schema_version: '1.1',
    artifact_type: 'specification',
    nodes: [
      { id: 'ASM-1', type: 'assumption', claim_kind: 'assumption', title: 'A', statement: 'S.', status: 'unconfirmed', source: 'user-stated', confidence: 'low', impact_if_false: ['D-99 must be revisited'] },
    ],
    edges: [],
  };
  const danglingImpactFile = join(tempDir, 'dangling-impact.json');
  writeFileSync(danglingImpactFile, JSON.stringify(danglingImpact, null, 2));
  expectRun('completeness dangling impact strict', COMPLETENESS, [danglingImpactFile, '--strict'], 1, 'impact_if_false references unknown node D-99');

  // A test_case verifying nothing is a warning surfaced under --strict.
  const lonelyTest = {
    schema_version: '1.1',
    artifact_type: 'test_plan',
    nodes: [
      { id: 'TC-1', type: 'test_case', claim_kind: 'verification', title: 'TC', statement: 'Verify.', status: 'approved' },
    ],
    edges: [],
  };
  const lonelyTestFile = join(tempDir, 'lonely-test.json');
  writeFileSync(lonelyTestFile, JSON.stringify(lonelyTest, null, 2));
  expectRun('completeness lonely test strict', COMPLETENESS, [lonelyTestFile, '--strict'], 1, 'test case verifies nothing');
}

function main() {
  const tempDir = mkdtempSync(join(tmpdir(), 'planning-forge-views-'));
  try {
    testYamlParser();
    testYamlRoundTrip();
    testValidatorYaml(tempDir);
    testGenerator(tempDir);
    testCompleteness(tempDir);
    process.stdout.write(`Planning Forge metamodel view tests passed (${passed} assertions)\n`);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

main();
