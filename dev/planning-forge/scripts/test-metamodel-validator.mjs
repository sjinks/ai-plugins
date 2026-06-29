#!/usr/bin/env node
// Smoke tests for Planning Forge metamodel validation.

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const VALIDATOR = resolve(SCRIPT_DIR, 'validate-metamodel.mjs');
const VALID_FIXTURE = resolve(
  SCRIPT_DIR,
  '../fixtures/metamodel/minimal-planning-bundle.json',
);

const base = {
  schema_version: '1.0',
  artifact_type: 'planning_bundle',
  nodes: [
    {
      id: 'FR-1',
      type: 'functional_requirement',
      title: 'Requirement',
      statement: 'The system MUST do the thing.',
      status: 'approved',
    },
    {
      id: 'AC-1',
      type: 'acceptance_criterion',
      title: 'Criterion',
      statement: 'The thing is observable.',
      status: 'approved',
    },
    {
      id: 'TC-1',
      type: 'test_case',
      title: 'Test',
      statement: 'Verify the thing.',
      status: 'approved',
    },
  ],
  edges: [
    { source: 'FR-1', relationship: 'demonstrated_by', target: 'AC-1' },
    { source: 'AC-1', relationship: 'verified_by', target: 'TC-1' },
  ],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function runValidator(file) {
  return spawnSync(process.execPath, [VALIDATOR, file], {
    encoding: 'utf8',
  });
}

function expectCase(label, artifact, expectedStatus, expectedText, tempDir) {
  const file = join(tempDir, `${label}.json`);
  writeFileSync(file, JSON.stringify(artifact, null, 2));
  const result = runValidator(file);
  const output = `${result.stdout}\n${result.stderr}`;
  if (result.status !== expectedStatus) {
    throw new Error(`${label}: expected exit ${expectedStatus}, got ${result.status}\n${output}`);
  }
  if (!output.includes(expectedText)) {
    throw new Error(`${label}: expected output to include ${JSON.stringify(expectedText)}\n${output}`);
  }
}

function main() {
  const tempDir = mkdtempSync(join(tmpdir(), 'planning-forge-metamodel-'));
  try {
    const validResult = runValidator(VALID_FIXTURE);
    if (validResult.status !== 0) {
      throw new Error(`valid fixture failed\n${validResult.stdout}\n${validResult.stderr}`);
    }

    const duplicate = clone(base);
    duplicate.nodes.push(clone(duplicate.nodes[0]));
    expectCase('duplicate-id', duplicate, 1, 'duplicate node id: FR-1', tempDir);

    const mismatch = clone(base);
    mismatch.nodes[0].type = 'user_story';
    expectCase('type-prefix-mismatch', mismatch, 1, 'FR-1: type user_story does not match FR- prefix', tempDir);

    const zeroId = clone(base);
    zeroId.nodes[0].id = 'FR-0';
    expectCase('zero-id', zeroId, 1, 'string does not match pattern', tempDir);

    const leadingZeroId = clone(base);
    leadingZeroId.nodes[0].id = 'FR-01';
    expectCase('leading-zero-id', leadingZeroId, 1, 'string does not match pattern', tempDir);

    const invalidNamespace = clone(base);
    invalidNamespace.id_namespace = 'bad namespace';
    expectCase('invalid-namespace', invalidNamespace, 1, 'string does not match pattern', tempDir);

    const missingNamespace = clone(base);
    missingNamespace.nodes[0].id = 'SESSION-FR-1';
    expectCase('missing-namespace', missingNamespace, 1, 'namespaced id requires id_namespace SESSION', tempDir);

    const namespaceMismatch = clone(base);
    namespaceMismatch.id_namespace = 'SESSION';
    expectCase('namespace-mismatch', namespaceMismatch, 1, 'FR-1: namespace none does not match id_namespace SESSION', tempDir);

    const missing = clone(base);
    missing.edges.push({ source: 'FR-1', relationship: 'demonstrated_by', target: 'AC-99' });
    expectCase('missing-edge-node', missing, 1, 'references missing node AC-99', tempDir);

    const invalidExternal = clone(base);
    invalidExternal.edges.push({ source: 'FR-1', relationship: 'depends_on', target: 'external thing' });
    expectCase('invalid-external-ref', invalidExternal, 1, 'string does not match pattern', tempDir);

    const selfEdge = clone(base);
    selfEdge.edges.push({ source: 'FR-1', relationship: 'depends_on', target: 'FR-1' });
    expectCase('self-edge', selfEdge, 1, 'points FR-1 to itself', tempDir);

    const reversed = clone(base);
    reversed.edges.push({ source: 'AC-1', relationship: 'demonstrated_by', target: 'FR-1' });
    expectCase('reversed-demonstrated-by', reversed, 1, 'relationship demonstrated_by does not allow source AC-1', tempDir);

    const reversedSatisfies = clone(base);
    reversedSatisfies.edges.push({ source: 'Goal', relationship: 'satisfies', target: 'US-1' });
    expectCase('reversed-satisfies', reversedSatisfies, 1, 'relationship satisfies does not allow source Goal', tempDir);

    const invalidSatisfiesTarget = clone(base);
    invalidSatisfiesTarget.edges.push({ source: 'FR-1', relationship: 'satisfies', target: 'AC-1' });
    expectCase('invalid-satisfies-target', invalidSatisfiesTarget, 1, 'relationship satisfies does not allow target AC-1', tempDir);

    const invalidRefines = clone(base);
    invalidRefines.edges.push({ source: 'TC-1', relationship: 'refines', target: 'FR-1' });
    expectCase('invalid-refines-source', invalidRefines, 1, 'relationship refines does not allow source TC-1', tempDir);

    const invalidDemonstratedTarget = clone(base);
    invalidDemonstratedTarget.edges.push({ source: 'FR-1', relationship: 'demonstrated_by', target: 'TC-1' });
    expectCase('invalid-demonstrated-target', invalidDemonstratedTarget, 1, 'relationship demonstrated_by does not allow target TC-1', tempDir);

    const malformed = clone(base);
    malformed.nodes = [null];
    expectCase('malformed-shape', malformed, 1, '$.nodes[0]: expected type object', tempDir);

    process.stdout.write('Planning Forge metamodel validator tests passed\n');
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

main();