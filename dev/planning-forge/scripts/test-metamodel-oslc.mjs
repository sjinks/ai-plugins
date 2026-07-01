#!/usr/bin/env node
// Smoke tests for the Planning Forge OSLC exporter: buildOslc() structure and
// the export-metamodel-oslc.mjs CLI.

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildOslc } from './lib/oslc.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const EXPORTER = resolve(SCRIPT_DIR, 'export-metamodel-oslc.mjs');
const FIXTURES = resolve(SCRIPT_DIR, '../fixtures/metamodel');

let passed = 0;

function assert(condition, message) {
  if (!condition) throw new Error(message);
  passed++;
}

function run(script, args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
}

function tagBalance(xml, tag) {
  // Opening tag may be followed by whitespace (incl. newline), attributes, or >.
  const open = (xml.match(new RegExp(`<${tag}(?:[\\s>])`, 'g')) || []).length;
  const close = (xml.match(new RegExp(`</${tag}>`, 'g')) || []).length;
  return open === close;
}

function testStructure() {
  const artifact = {
    schema_version: '1.1',
    artifact_type: 'planning_bundle',
    title: 'Bundle',
    nodes: [
      { id: 'FR-1', type: 'functional_requirement', claim_kind: 'requirement', title: 'Req', statement: 'MUST do X.', obligation: 'must', status: 'approved' },
      { id: 'AC-1', type: 'acceptance_criterion', claim_kind: 'verification', title: 'AC', statement: 'Observable.', status: 'approved' },
      { id: 'TC-1', type: 'test_case', claim_kind: 'verification', title: 'TC', statement: 'Verify.', status: 'approved' },
      { id: 'D-1', type: 'architecture_decision', claim_kind: 'decision', title: 'Decision', statement: 'Use store.', status: 'proposed' },
    ],
    edges: [
      { source: 'FR-1', relationship: 'demonstrated_by', target: 'AC-1' },
      { source: 'AC-1', relationship: 'verified_by', target: 'TC-1' },
      { source: 'FR-1', relationship: 'realized_by', target: 'D-1' },
    ],
  };
  const xml = buildOslc(artifact, { base: 'urn:pf:' });

  assert(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'oslc: xml declaration present');
  assert(xml.includes('<rdf:RDF'), 'oslc: rdf root present');
  assert(xml.includes('xmlns:oslc_rm="http://open-services.net/ns/rm#"'), 'oslc: rm namespace declared');
  assert(tagBalance(xml, 'rdf:RDF'), 'oslc: rdf:RDF balanced');
  assert(tagBalance(xml, 'rdf:Description'), 'oslc: rdf:Description balanced');

  // One resource per node.
  assert((xml.match(/<rdf:Description /g) || []).length === 4, 'oslc: four resources');

  // rdf:type mapping per domain.
  assert(xml.includes('<rdf:type rdf:resource="http://open-services.net/ns/rm#Requirement"/>'), 'oslc: FR typed as rm:Requirement');
  assert(xml.includes('<rdf:type rdf:resource="http://open-services.net/ns/qm#TestCase"/>'), 'oslc: TC typed as qm:TestCase');
  assert(xml.includes('<rdf:type rdf:resource="http://open-services.net/ns/am#Resource"/>'), 'oslc: D typed as am:Resource');

  // Relationship predicate mapping.
  assert(xml.includes('<pf:demonstratedBy rdf:resource="urn:pf:AC-1"/>'), 'oslc: demonstrated_by -> pf:demonstratedBy');
  assert(xml.includes('<oslc_rm:validatedBy rdf:resource="urn:pf:TC-1"/>'), 'oslc: verified_by -> oslc_rm:validatedBy');
  assert(xml.includes('<oslc_am:elaboratedBy rdf:resource="urn:pf:D-1"/>'), 'oslc: realized_by -> oslc_am:elaboratedBy');

  // Provenance: obligation emitted for the must FR.
  assert(xml.includes('<pf:obligation>must</pf:obligation>'), 'oslc: obligation literal present');
}

function testReverseEdges() {
  // derives_from and refines map to reverse-reading OSLC predicates, so the
  // single emitted triple swaps subject and object.
  const artifact = {
    schema_version: '1.1',
    artifact_type: 'specification',
    nodes: [
      { id: 'US-1', type: 'user_story', claim_kind: 'requirement', title: 'US', statement: 'S.', status: 'approved' },
      { id: 'RULE-1', type: 'business_rule', claim_kind: 'requirement', title: 'Rule', statement: 'S.', status: 'approved' },
      { id: 'FR-1', type: 'functional_requirement', claim_kind: 'requirement', title: 'FR', statement: 'S.', status: 'approved' },
    ],
    edges: [
      { source: 'RULE-1', relationship: 'refines', target: 'US-1' },
      { source: 'FR-1', relationship: 'derives_from', target: 'RULE-1' },
    ],
  };
  const xml = buildOslc(artifact, { base: 'urn:pf:' });

  // refines: RULE-1 refines US-1 -> US-1 decomposedBy RULE-1 (subject swapped).
  const usBlock = xml.slice(xml.indexOf('rdf:about="urn:pf:US-1"'), xml.indexOf('rdf:about="urn:pf:RULE-1"'));
  assert(usBlock.includes('<oslc_rm:decomposedBy rdf:resource="urn:pf:RULE-1"/>'), 'oslc: refines swaps to decomposedBy on parent');
  assert(!xml.includes('<oslc_rm:decomposedBy rdf:resource="urn:pf:US-1"/>'), 'oslc: refines does not link child->parent');

  // derives_from: FR-1 derives_from RULE-1 -> RULE-1 elaboratedBy FR-1 (swapped).
  const ruleBlock = xml.slice(xml.indexOf('rdf:about="urn:pf:RULE-1"'), xml.indexOf('rdf:about="urn:pf:FR-1"'));
  assert(ruleBlock.includes('<oslc_rm:elaboratedBy rdf:resource="urn:pf:FR-1"/>'), 'oslc: derives_from swaps to elaboratedBy on source-target');

  // Exactly one triple per edge (no duplicate reverse links).
  assert((xml.match(/<oslc_rm:decomposedBy /g) || []).length === 1, 'oslc: one decomposedBy triple');
  assert((xml.match(/<oslc_rm:elaboratedBy /g) || []).length === 1, 'oslc: one elaboratedBy triple');
}

function testExternalEndpoints() {
  const artifact = {
    schema_version: '1.1',
    artifact_type: 'specification',
    nodes: [
      { id: 'US-1', type: 'user_story', claim_kind: 'requirement', title: 'US', statement: 'S.', status: 'approved' },
      { id: 'D-1', type: 'architecture_decision', claim_kind: 'decision', title: 'D', statement: 'S.', status: 'proposed' },
    ],
    edges: [
      { source: 'US-1', relationship: 'satisfies', target: 'Goal' },
      { source: 'D-1', relationship: 'mitigates', target: 'risk: data loss' },
      { source: 'D-1', relationship: 'mitigates', target: 'risk: downtime' },
    ],
  };
  const xml = buildOslc(artifact, { base: 'urn:pf:' });
  assert(xml.includes('<pf:externalKind>external_goal</pf:externalKind>'), 'oslc: external goal classified');
  assert(xml.includes('<pf:externalKind>external_risk</pf:externalKind>'), 'oslc: external risk classified');
  // Two distinct risks -> two distinct external resources.
  assert(xml.includes('urn:pf:external:2') && xml.includes('urn:pf:external:3'), 'oslc: distinct same-kind externals get distinct IRIs');
  assert(xml.includes('<oslc_rm:satisfies rdf:resource="urn:pf:external:1"/>'), 'oslc: external endpoint linked by IRI');
  assert((xml.match(/#External"/g) || []).length === 3, 'oslc: three external resources typed');
}

function testProvenanceEvidence() {
  const artifact = {
    schema_version: '1.1',
    artifact_type: 'specification',
    nodes: [
      { id: 'ASM-1', type: 'assumption', claim_kind: 'assumption', title: 'A', statement: 'S.', status: 'unconfirmed', source: 'inferred-from-repository', confidence: 'low', impact_if_false: ['FR-1 revisited'], evidence: [{ kind: 'file', ref: 'src/x.ts' }, { kind: 'node', ref: 'FR-1' }] },
      { id: 'FR-1', type: 'functional_requirement', claim_kind: 'requirement', title: 'FR', statement: 'S.', status: 'approved' },
    ],
    edges: [],
  };
  const xml = buildOslc(artifact, { base: 'urn:pf:' });
  assert(xml.includes('<dcterms:source>inferred-from-repository</dcterms:source>'), 'oslc: source -> dcterms:source');
  assert(xml.includes('<pf:confidence>low</pf:confidence>'), 'oslc: confidence literal');
  assert(xml.includes('<pf:impactIfFalse>FR-1 revisited</pf:impactIfFalse>'), 'oslc: impact_if_false literal');
  assert(xml.includes('<pf:evidence>file: src/x.ts</pf:evidence>'), 'oslc: non-node evidence literal');
  assert(xml.includes('<prov:wasInfluencedBy rdf:resource="urn:pf:FR-1"/>'), 'oslc: node evidence -> prov link');

  // A node-evidence ref that does not resolve (unvalidated artifact) is
  // downgraded to a literal rather than emitting a dangling link target.
  const dangling = {
    schema_version: '1.1',
    artifact_type: 'specification',
    nodes: [
      { id: 'ASM-1', type: 'assumption', claim_kind: 'assumption', title: 'A', statement: 'S.', status: 'unconfirmed', source: 'user-stated', confidence: 'low', impact_if_false: ['x'], evidence: [{ kind: 'node', ref: 'FR-99' }] },
    ],
    edges: [],
  };
  const dxml = buildOslc(dangling, { base: 'urn:pf:' });
  assert(!dxml.includes('rdf:resource="urn:pf:FR-99"'), 'oslc: unresolved node evidence not linked');
  assert(dxml.includes('<pf:evidence>node: FR-99</pf:evidence>'), 'oslc: unresolved node evidence downgraded to literal');
}

function testEscaping() {
  const artifact = {
    schema_version: '1.1',
    artifact_type: 'specification',
    nodes: [
      { id: 'FR-1', type: 'functional_requirement', claim_kind: 'requirement', title: 'Quote " & <x>', statement: 'a < b && c > d', status: 'approved' },
    ],
    edges: [],
  };
  const xml = buildOslc(artifact, { base: 'urn:pf:' });
  assert(xml.includes('<dcterms:title>Quote " &amp; &lt;x&gt;</dcterms:title>'), 'oslc: element text escaped');
  assert(xml.includes('a &lt; b &amp;&amp; c &gt; d'), 'oslc: statement angle/amp escaped');
}

function testIllegalAndAstral() {
  const artifact = {
    schema_version: '1.1',
    artifact_type: 'specification',
    nodes: [
      { id: 'FR-1', type: 'functional_requirement', claim_kind: 'requirement', title: 'Null\u0000 \u0007bell \u{1F600}', statement: 'Lone \uD800 keep \u{20BB7}.', status: 'approved' },
    ],
    edges: [],
  };
  const xml = buildOslc(artifact, { base: 'urn:pf:' });
  assert(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(xml), 'oslc: illegal control chars stripped');
  assert(xml.includes('\u{1F600}'), 'oslc: astral emoji preserved');
  assert(xml.includes('\u{20BB7}'), 'oslc: astral CJK preserved');
  // No unpaired surrogate code unit survives.
  const units = [];
  for (let i = 0; i < xml.length; i++) units.push(xml.charCodeAt(i));
  let lone = 0;
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (u >= 0xd800 && u <= 0xdbff) {
      if (units[i + 1] >= 0xdc00 && units[i + 1] <= 0xdfff) i++;
      else lone++;
    } else if (u >= 0xdc00 && u <= 0xdfff) {
      lone++;
    }
  }
  assert(lone === 0, 'oslc: no lone surrogate remains');
}

function testReferentialIntegrity() {
  // Every rdf:resource link target must be a declared resource IRI (rdf:about),
  // for the metamodel fixture (no external endpoints reference dangling nodes).
  const xml = buildOslc(JSON.parse(readFileSync(join(FIXTURES, 'minimal-planning-bundle.json'), 'utf8')), { base: 'urn:pf:' });
  const subjects = new Set([...xml.matchAll(/rdf:about="([^"]+)"/g)].map((m) => m[1]));
  for (const m of xml.matchAll(/rdf:resource="(urn:pf:[^"]+)"/g)) {
    assert(subjects.has(m[1]), `oslc: link target ${m[1]} resolves to a resource`);
  }
}

function testCli(tempDir) {
  const stdout = run(EXPORTER, [join(FIXTURES, 'test-plan.yaml')]);
  assert(stdout.status === 0, 'cli: yaml fixture exits 0');
  assert(stdout.stdout.includes('<rdf:RDF'), 'cli: yaml fixture emits rdf');

  const outFile = join(tempDir, 'out.rdf');
  const written = run(EXPORTER, [join(FIXTURES, 'specification.json'), '--out', outFile]);
  assert(written.status === 0, 'cli: --out exits 0');
  assert(written.stdout.includes('OSLC written'), 'cli: --out reports path');
  assert(readFileSync(outFile, 'utf8').includes('<rdf:RDF'), 'cli: --out file contains rdf');

  const based = run(EXPORTER, [join(FIXTURES, 'specification.json'), '--base', 'http://example.com/pf/']);
  assert(based.status === 0, 'cli: --base exits 0');
  assert(based.stdout.includes('rdf:about="http://example.com/pf/FR-1"'), 'cli: --base sets IRI prefix');

  const badBase = run(EXPORTER, [join(FIXTURES, 'specification.json'), '--base', 'bad base ']);
  assert(badBase.status === 2, 'cli: IRI-illegal --base exits 2');
  assert(badBase.stderr.includes('valid IRI prefix'), 'cli: IRI-illegal --base reports reason');

  const missing = run(EXPORTER, [join(tempDir, 'nope.json')]);
  assert(missing.status === 2, 'cli: missing file exits 2');

  const badRoot = join(tempDir, 'bad-root.json');
  writeFileSync(badRoot, '[]');
  assert(run(EXPORTER, [badRoot]).status === 2, 'cli: array root exits 2');

  const badNodes = join(tempDir, 'bad-nodes.json');
  writeFileSync(badNodes, JSON.stringify({ schema_version: '1.1', artifact_type: 'specification', nodes: {}, edges: [] }));
  assert(run(EXPORTER, [badNodes]).status === 2, 'cli: non-array nodes exits 2');
}

function main() {
  const tempDir = mkdtempSync(join(tmpdir(), 'planning-forge-oslc-'));
  try {
    testStructure();
    testReverseEdges();
    testExternalEndpoints();
    testProvenanceEvidence();
    testEscaping();
    testIllegalAndAstral();
    testReferentialIntegrity();
    testCli(tempDir);
    process.stdout.write(`Planning Forge OSLC export tests passed (${passed} assertions)\n`);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

main();
