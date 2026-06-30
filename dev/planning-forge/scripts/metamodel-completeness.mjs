#!/usr/bin/env node
// Report traceability completeness for a Planning Forge metamodel artifact.
//
// This is a coverage report, not a schema validator: run validate-metamodel.mjs
// first for structural/provenance validity. Completeness checks answer
// "is the planning graph adequately connected?" rather than "is it well-formed?".
//
// Gaps are classified by severity:
//   error    A coverage rule that should hold for a finished artifact is broken.
//   warning  A softer gap that may be intentional (e.g. a deferred requirement).
//
// Usage:
//   node dev/planning-forge/scripts/metamodel-completeness.mjs <artifact.(json|yaml|yml)> [--strict]
//
// --strict treats warnings as failures (exit 1 if any warning).
//
// Exit codes:
//   0 = complete (no errors; warnings allowed unless --strict)
//   1 = coverage gaps found
//   2 = invalid usage or missing/unparseable artifact

import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from '../../../code-explorer/scripts/lib/cli.mjs';
import { loadArtifact, indexArtifact } from './lib/artifact.mjs';

const ARG_SPEC = {
  positionals: [{ name: 'artifact', required: true }],
  flags: {
    '--strict': { type: 'boolean' },
  },
};

// Statuses that mean the node is not expected to be fully connected yet.
const INACTIVE_STATUS = new Set(['deferred', 'superseded', 'removed', 'out_of_scope', 'rejected']);

function usageError(message) {
  process.stderr.write(`error: ${message}\n`);
  process.stderr.write('usage: node dev/planning-forge/scripts/metamodel-completeness.mjs <artifact.(json|yaml|yml)> [--strict]\n');
  process.exit(2);
}

function isActive(node) {
  return !INACTIVE_STATUS.has(node.status);
}

function hasOutgoing(outgoing, id, relationship) {
  return (outgoing.get(id) || []).some((e) => e.relationship === relationship);
}

function hasIncoming(incoming, id, relationship) {
  return (incoming.get(id) || []).some((e) => e.relationship === relationship);
}

function checkCompleteness(artifact) {
  const { nodesById, outgoing, incoming } = indexArtifact(artifact);
  const errors = [];
  const warnings = [];

  // Coverage expectations differ by stage. A specification or architecture
  // artifact does not contain its own test cases (those live in the test plan),
  // so "AC verified_by a test" is a cross-artifact concern there, not a local
  // error. A test_plan or planning_bundle is expected to close that loop.
  const type = artifact.artifact_type;
  const expectsTests = type === 'test_plan' || type === 'planning_bundle';
  const expectsDemonstration = type === 'specification' || type === 'planning_bundle';

  for (const node of artifact.nodes || []) {
    if (!isActive(node)) continue;

    // Functional/quality requirements must be demonstrated by an acceptance
    // criterion; a `may` requirement is a softer (warning) expectation. Only
    // enforced for stages that own acceptance criteria.
    if (expectsDemonstration && ['functional_requirement', 'quality_requirement'].includes(node.type)) {
      if (!hasOutgoing(outgoing, node.id, 'demonstrated_by')) {
        const list = node.obligation === 'may' ? warnings : errors;
        list.push(`${node.id}: no demonstrated_by edge to an acceptance criterion`);
      }
    }

    // Business rules are policy: they are covered when demonstrated directly or
    // when a refining requirement enforces them (an FR `refines` the rule).
    if (node.type === 'business_rule') {
      const demonstrated = hasOutgoing(outgoing, node.id, 'demonstrated_by');
      const refinedByRequirement = hasIncoming(incoming, node.id, 'refines');
      if (!demonstrated && !refinedByRequirement) {
        warnings.push(`${node.id}: business rule is neither demonstrated_by an AC nor refined by a requirement`);
      }
    }

    // User stories should be demonstrated or refined into requirements.
    if (node.type === 'user_story') {
      const demonstrated = hasOutgoing(outgoing, node.id, 'demonstrated_by');
      const refined = hasIncoming(incoming, node.id, 'refines');
      if (!demonstrated && !refined) {
        warnings.push(`${node.id}: user story is neither demonstrated_by an AC nor refined into a requirement`);
      }
    }

    // Acceptance criteria should be verified by a test/manual/review/command.
    // Only enforced for stages that own test cases.
    if (expectsTests && node.type === 'acceptance_criterion') {
      if (!hasOutgoing(outgoing, node.id, 'verified_by')) {
        errors.push(`${node.id}: no verified_by edge to a test or check`);
      }
    }

    // MUST-handle edge cases should be verified once tests are in scope.
    if (expectsTests && node.type === 'edge_case') {
      if (!hasOutgoing(outgoing, node.id, 'verified_by') && !hasIncoming(incoming, node.id, 'mitigates')) {
        warnings.push(`${node.id}: edge case is neither verified_by a test nor mitigated by a decision`);
      }
    }

    // Architecture decisions should realize at least one requirement.
    if (node.type === 'architecture_decision') {
      if (!hasIncoming(incoming, node.id, 'realized_by')) {
        warnings.push(`${node.id}: decision does not realize any requirement (no realized_by edge points to it)`);
      }
    }

    // Test cases should verify at least one upstream item.
    if (node.type === 'test_case') {
      if (!hasIncoming(incoming, node.id, 'verified_by')) {
        warnings.push(`${node.id}: test case verifies nothing (no verified_by edge points to it)`);
      }
    }

    // Assumptions should record downstream impact (also enforced by validator,
    // repeated here so an artifact authored without the validator is still flagged).
    if (node.type === 'assumption') {
      if (!Array.isArray(node.impact_if_false) || node.impact_if_false.length === 0) {
        errors.push(`${node.id}: assumption has no impact_if_false`);
      }
    }
  }

  // Every impact_if_false entry that looks like a stable ID should resolve.
  for (const node of artifact.nodes || []) {
    for (const impact of node.impact_if_false || []) {
      const token = String(impact).split(/\s+/)[0];
      if (/^([A-Z]{1,8}-)?(US|RULE|FR|NFR|INT|AC|EDGE|ASM|D|TC)-[1-9][0-9]*$/.test(token) && !nodesById.has(token)) {
        warnings.push(`${node.id}: impact_if_false references unknown node ${token}`);
      }
    }
  }

  return { errors, warnings };
}

function main() {
  const { values: args, error } = parseArgs(process.argv.slice(2), ARG_SPEC);
  if (error) usageError(error);

  const artifactPath = resolve(args.artifact);
  if (!existsSync(artifactPath) || !statSync(artifactPath).isFile()) {
    usageError(`artifact file not found: ${artifactPath}`);
  }

  let artifact;
  try {
    artifact = loadArtifact(artifactPath);
  } catch (err) {
    usageError(err.message);
  }
  if (artifact === null || typeof artifact !== 'object' || Array.isArray(artifact)) {
    usageError('artifact root must be a mapping/object');
  }

  const { errors, warnings } = checkCompleteness(artifact);

  for (const w of warnings) process.stdout.write(`warning: ${w}\n`);
  for (const e of errors) process.stdout.write(`error: ${e}\n`);

  const failed = errors.length > 0 || (args.strict && warnings.length > 0);
  if (failed) {
    process.stdout.write(
      `Planning Forge completeness: ${errors.length} error(s), ${warnings.length} warning(s)\n`,
    );
    process.exit(1);
  }

  process.stdout.write(
    `Planning Forge completeness passed: ${artifactPath} (${errors.length} errors, ${warnings.length} warnings)\n`,
  );
}

main();
