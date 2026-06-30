#!/usr/bin/env node
// Smoke tests for the Planning Forge ReqIF exporter: buildReqif() structure and
// the export-metamodel-reqif.mjs CLI.

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildReqif } from './lib/reqif.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const EXPORTER = resolve(SCRIPT_DIR, 'export-metamodel-reqif.mjs');
const FIXTURES = resolve(SCRIPT_DIR, '../fixtures/metamodel');

const NOW = '2020-01-01T00:00:00.000Z';

let passed = 0;

function assert(condition, message) {
  if (!condition) throw new Error(message);
  passed++;
}

function run(script, args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
}

// Count well-formedness loosely: every opened non-self-closing tag must close.
// We do not have an XML parser dependency, so assert tag balance for the
// elements that carry the document's structure.
function tagBalance(xml, tag) {
  const open = (xml.match(new RegExp(`<${tag}[ >]`, 'g')) || []).length;
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
    ],
    edges: [
      { source: 'FR-1', relationship: 'demonstrated_by', target: 'AC-1' },
      { source: 'AC-1', relationship: 'verified_by', target: 'TC-1' },
    ],
  };
  const xml = buildReqif(artifact, { now: NOW });

  assert(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'reqif: xml declaration present');
  assert(xml.includes('<REQ-IF xmlns="http://www.omg.org/spec/ReqIF/20110401/reqif.xsd">'), 'reqif: root namespace present');
  assert(xml.includes('<REQ-IF-VERSION>1.0</REQ-IF-VERSION>'), 'reqif: version 1.0');
  assert(xml.includes(`<CREATION-TIME>${NOW}</CREATION-TIME>`), 'reqif: creation time uses provided now');

  for (const tag of ['REQ-IF', 'SPEC-OBJECTS', 'SPEC-RELATIONS', 'SPEC-OBJECT', 'SPEC-RELATION', 'SPECIFICATION']) {
    assert(tagBalance(xml, tag), `reqif: ${tag} tags balanced`);
  }

  // One SPEC-OBJECT per node, one SPEC-RELATION per edge.
  assert((xml.match(/<SPEC-OBJECT /g) || []).length === 3, 'reqif: three spec objects');
  assert((xml.match(/<SPEC-RELATION /g) || []).length === 2, 'reqif: two spec relations');

  // Only the used node types get a SPEC-OBJECT-TYPE; unused ones are omitted.
  assert(xml.includes('<SPEC-OBJECT-TYPE IDENTIFIER="_sot-functional_requirement"'), 'reqif: used type emitted');
  assert(!xml.includes('_sot-user_story'), 'reqif: unused type omitted');

  // Enum value mapped for status; obligation present for the must FR.
  assert(xml.includes('<ENUM-VALUE-REF>_ev-status-approved</ENUM-VALUE-REF>'), 'reqif: status enum value');
  assert(xml.includes('<ENUM-VALUE-REF>_ev-obligation-must</ENUM-VALUE-REF>'), 'reqif: obligation enum value');

  // Canonical edge direction preserved (source FR-1 -> target AC-1).
  const rel = xml.slice(xml.indexOf('<SPEC-RELATION '));
  assert(rel.indexOf('_so-FR-1') < rel.indexOf('_so-AC-1'), 'reqif: edge source precedes target');
}

function testExternalEndpoints() {
  const artifact = {
    schema_version: '1.1',
    artifact_type: 'specification',
    nodes: [
      { id: 'US-1', type: 'user_story', claim_kind: 'requirement', title: 'US', statement: 'S.', status: 'approved' },
    ],
    edges: [{ source: 'US-1', relationship: 'satisfies', target: 'Goal' }],
  };
  const xml = buildReqif(artifact, { now: NOW });
  assert(xml.includes('<SPEC-OBJECT-TYPE IDENTIFIER="_sot-external"'), 'reqif: external type emitted when needed');
  assert(xml.includes('THE-VALUE="external_goal"'), 'reqif: external kind classified');
  assert((xml.match(/<SPEC-OBJECT /g) || []).length === 2, 'reqif: node + external object');
  // The relation must reference the synthesized external object id, not a raw label.
  assert(xml.includes('<SPEC-OBJECT-REF>_so-x-1</SPEC-OBJECT-REF>'), 'reqif: external endpoint referenced by id');

  // Two distinct external endpoints sharing one kind get two distinct objects.
  const twoRisks = {
    schema_version: '1.1',
    artifact_type: 'planning_bundle',
    nodes: [
      { id: 'D-1', type: 'architecture_decision', claim_kind: 'decision', title: 'D', statement: 'S.', status: 'proposed' },
    ],
    edges: [
      { source: 'D-1', relationship: 'mitigates', target: 'risk: data loss' },
      { source: 'D-1', relationship: 'mitigates', target: 'risk: downtime' },
    ],
  };
  const twoXml = buildReqif(twoRisks, { now: NOW });
  assert((twoXml.match(/_sot-external/g) || []).length >= 1, 'reqif: external type present for risks');
  assert(twoXml.includes('_so-x-1') && twoXml.includes('_so-x-2'), 'reqif: distinct same-kind externals get distinct ids');
  assert((twoXml.match(/<SPEC-OBJECT IDENTIFIER="_so-x-/g) || []).length === 2, 'reqif: two external objects materialized');
}

function testEscaping() {
  const artifact = {
    schema_version: '1.1',
    artifact_type: 'specification',
    title: 'A & B <tag>',
    nodes: [
      { id: 'FR-1', type: 'functional_requirement', claim_kind: 'requirement', title: 'Quote " & <x>', statement: 'a < b && c > d', status: 'approved' },
    ],
    edges: [],
  };
  const xml = buildReqif(artifact, { now: NOW });
  assert(xml.includes('<TITLE>A &amp; B &lt;tag&gt;</TITLE>'), 'reqif: header title escaped');
  assert(xml.includes('THE-VALUE="Quote &quot; &amp; &lt;x&gt;"'), 'reqif: attribute value escaped');
  assert(!xml.includes('a < b'), 'reqif: statement angle brackets escaped');
}

function testIllegalChars() {
  const artifact = {
    schema_version: '1.1',
    artifact_type: 'specification',
    title: 'Bell\u0007 and esc\u001b',
    nodes: [
      { id: 'FR-1', type: 'functional_requirement', claim_kind: 'requirement', title: 'Null\u0000byte', statement: 'Lone surrogate \uD800 and vtab\u000b.', status: 'approved' },
    ],
    edges: [{ source: 'FR-1', relationship: 'satisfies', target: 'risk: boom\u0007' }],
  };
  const xml = buildReqif(artifact, { now: NOW });
  // No raw C0/C1 control characters (except legal tab/newline/CR) survive.
  assert(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(xml), 'reqif: illegal control chars stripped');
  assert(!/[\uD800-\uDFFF]/.test(xml), 'reqif: lone surrogates stripped');
  assert(xml.includes('THE-VALUE="Nullbyte"'), 'reqif: null byte removed from value');
}

function testAstralPreserved() {
  const artifact = {
    schema_version: '1.1',
    artifact_type: 'specification',
    nodes: [
      { id: 'FR-1', type: 'functional_requirement', claim_kind: 'requirement', title: 'Emoji \u{1F600} and CJK \u{20BB7}', statement: 'Lone \uD800 then valid \u{1F600}.', status: 'approved' },
    ],
    edges: [],
  };
  const xml = buildReqif(artifact, { now: NOW });
  // Valid supplementary-plane characters survive intact; only the lone
  // surrogate is dropped.
  assert(xml.includes('\u{1F600}'), 'reqif: astral emoji preserved');
  assert(xml.includes('\u{20BB7}'), 'reqif: astral CJK ideograph preserved');
  // No unpaired surrogate code unit remains (astral chars are valid pairs and
  // must not be counted). Iterating by UTF-16 unit, every surrogate must have a
  // valid partner.
  const units = [];
  for (let i = 0; i < xml.length; i++) units.push(xml.charCodeAt(i));
  let loneSurrogates = 0;
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (u >= 0xd800 && u <= 0xdbff) {
      const next = units[i + 1];
      if (next >= 0xdc00 && next <= 0xdfff) i++;
      else loneSurrogates++;
    } else if (u >= 0xdc00 && u <= 0xdfff) {
      loneSurrogates++;
    }
  }
  assert(loneSurrogates === 0, 'reqif: no lone surrogate remains');
}

function testWhitespacePreserved() {
  const artifact = {
    schema_version: '1.1',
    artifact_type: 'specification',
    nodes: [
      { id: 'FR-1', type: 'functional_requirement', claim_kind: 'requirement', title: 'Req', statement: 'line1\nline2\tcol', status: 'approved' },
    ],
    edges: [],
  };
  const xml = buildReqif(artifact, { now: NOW });
  // Newlines/tabs in attribute-borne text are encoded as numeric references so
  // they survive XML attribute-value normalization on read-back.
  assert(xml.includes('line1&#10;line2&#9;col'), 'reqif: newline/tab encoded in attribute');
  assert(!xml.includes('line1\nline2'), 'reqif: raw newline not left in attribute value');
}

function testNoEdges() {
  const artifact = {
    schema_version: '1.1',
    artifact_type: 'specification',
    nodes: [
      { id: 'FR-1', type: 'functional_requirement', claim_kind: 'requirement', title: 'Req', statement: 'S.', status: 'approved' },
    ],
    edges: [],
  };
  const xml = buildReqif(artifact, { now: NOW });
  assert(tagBalance(xml, 'SPEC-RELATIONS'), 'reqif: empty relations container balanced');
  assert(!xml.includes('_sot-external'), 'reqif: no external type without external endpoints');
}

function testReferentialIntegrity() {
  // Every SPEC-OBJECT-REF must point at a declared SPEC-OBJECT IDENTIFIER, and
  // every SPEC-OBJECT-TYPE-REF at a declared SPEC-OBJECT-TYPE.
  const xml = buildReqif(JSON.parse(readFileSync(join(FIXTURES, 'minimal-planning-bundle.json'), 'utf8')), { now: NOW });
  const objectIds = new Set([...xml.matchAll(/<SPEC-OBJECT IDENTIFIER="([^"]+)"/g)].map((m) => m[1]));
  for (const m of xml.matchAll(/<SPEC-OBJECT-REF>([^<]+)<\/SPEC-OBJECT-REF>/g)) {
    assert(objectIds.has(m[1]), `reqif: object ref ${m[1]} resolves`);
  }
  const typeIds = new Set([...xml.matchAll(/<SPEC-OBJECT-TYPE IDENTIFIER="([^"]+)"/g)].map((m) => m[1]));
  for (const m of xml.matchAll(/<SPEC-OBJECT-TYPE-REF>([^<]+)<\/SPEC-OBJECT-TYPE-REF>/g)) {
    assert(typeIds.has(m[1]), `reqif: object type ref ${m[1]} resolves`);
  }
}

function testCli(tempDir) {
  const stdout = run(EXPORTER, [join(FIXTURES, 'test-plan.yaml')]);
  assert(stdout.status === 0, 'cli: yaml fixture exits 0');
  assert(stdout.stdout.includes('<REQ-IF'), 'cli: yaml fixture emits reqif');

  const outFile = join(tempDir, 'out.reqif');
  const written = run(EXPORTER, [join(FIXTURES, 'specification.json'), '--out', outFile]);
  assert(written.status === 0, 'cli: --out exits 0');
  assert(written.stdout.includes('ReqIF written'), 'cli: --out reports path');
  assert(readFileSync(outFile, 'utf8').includes('<REQ-IF'), 'cli: --out file contains reqif');

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
  const tempDir = mkdtempSync(join(tmpdir(), 'planning-forge-reqif-'));
  try {
    testStructure();
    testExternalEndpoints();
    testEscaping();
    testIllegalChars();
    testAstralPreserved();
    testWhitespacePreserved();
    testNoEdges();
    testReferentialIntegrity();
    testCli(tempDir);
    process.stdout.write(`Planning Forge ReqIF export tests passed (${passed} assertions)\n`);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

main();
