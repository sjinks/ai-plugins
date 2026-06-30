#!/usr/bin/env node
// Validate a Planning Forge machine-readable metamodel artifact.
//
// Usage:
//   node dev/planning-forge/scripts/validate-metamodel.mjs <artifact.(json|yaml|yml)> [--schema <schema.json>]
//
// JSON is the canonical validated format; YAML (.yaml/.yml) is accepted as an
// authoring convenience and parsed into the same shape before validation.
//
// Exit codes:
//   0 = valid
//   1 = validation errors
//   2 = invalid usage or missing files

import { existsSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSchema, validate } from '../../../code-explorer/scripts/lib/json-schema.mjs';
import { parseArgs } from '../../../code-explorer/scripts/lib/cli.mjs';
import { EXTERNAL_REF_RE, loadArtifact, STABLE_ID_RE } from './lib/artifact.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SCHEMA = resolve(
  SCRIPT_DIR,
  '../../../planning-forge/shared/schemas/planning-artifact.schema.json',
);

const ARG_SPEC = {
  positionals: [{ name: 'artifact', required: true }],
  flags: {
    '--schema': { type: 'value', default: DEFAULT_SCHEMA },
  },
};

const TYPE_BY_PREFIX = {
  US: new Set(['user_story']),
  RULE: new Set(['business_rule']),
  FR: new Set(['functional_requirement']),
  NFR: new Set(['quality_requirement']),
  INT: new Set(['interface', 'data_shape']),
  AC: new Set(['acceptance_criterion']),
  EDGE: new Set(['edge_case']),
  ASM: new Set(['assumption']),
  D: new Set(['architecture_decision']),
  TC: new Set(['test_case']),
};

const REQUIRED_EVIDENCE_SOURCES = new Set([
  'inferred-from-repository',
  'repository-evidence',
  'external-reference',
  'private-note',
  'advisory-material',
  'derived-from-artifact',
]);

const CLAIM_KINDS_BY_TYPE = {
  user_story: new Set(['requirement', 'recommendation']),
  business_rule: new Set(['requirement', 'fact']),
  functional_requirement: new Set(['requirement', 'recommendation']),
  quality_requirement: new Set(['requirement', 'recommendation']),
  interface: new Set(['contract', 'fact', 'recommendation']),
  data_shape: new Set(['contract', 'fact', 'recommendation']),
  acceptance_criterion: new Set(['verification', 'recommendation']),
  edge_case: new Set(['requirement', 'recommendation']),
  assumption: new Set(['assumption']),
  architecture_decision: new Set(['decision', 'recommendation']),
  test_case: new Set(['verification', 'recommendation']),
};

const ALL_NODE_TYPES = new Set(Object.values(TYPE_BY_PREFIX).flatMap((types) => [...types]));
const DESIGNABLE_NODE_TYPES = new Set([
  'business_rule', 'functional_requirement', 'quality_requirement', 'interface',
  'data_shape', 'acceptance_criterion', 'edge_case', 'architecture_decision',
]);
const INTERNAL_CONTEXT_TYPES = new Set([...ALL_NODE_TYPES, 'external_goal', 'external_scope', 'external_risk']);

const RELATIONSHIP_RULES = {
  derives_from: {
    source: ALL_NODE_TYPES,
    target: INTERNAL_CONTEXT_TYPES,
  },
  satisfies: {
    source: new Set([
      'user_story', 'business_rule', 'functional_requirement',
      'quality_requirement',
    ]),
    target: new Set([
      'external_goal', 'external_scope', 'user_story', 'business_rule',
      'functional_requirement', 'quality_requirement',
    ]),
  },
  refines: {
    source: new Set([
      'business_rule', 'functional_requirement', 'quality_requirement',
      'interface', 'data_shape', 'acceptance_criterion', 'edge_case',
      'assumption',
    ]),
    target: new Set([
      'external_goal', 'external_scope', 'user_story', 'business_rule',
      'functional_requirement', 'quality_requirement', 'interface',
      'data_shape', 'acceptance_criterion', 'edge_case', 'assumption',
    ]),
  },
  constrains: {
    source: new Set([
      'business_rule', 'quality_requirement', 'edge_case', 'assumption',
      'architecture_decision',
    ]),
    target: DESIGNABLE_NODE_TYPES,
  },
  conflicts_with: {
    source: new Set([...ALL_NODE_TYPES, 'external_risk']),
    target: new Set([...ALL_NODE_TYPES, 'external_risk']),
  },
  depends_on: {
    source: ALL_NODE_TYPES,
    target: INTERNAL_CONTEXT_TYPES,
  },
  supersedes: {
    source: ALL_NODE_TYPES,
    target: ALL_NODE_TYPES,
  },
  realized_by: {
    source: new Set([
      'functional_requirement', 'quality_requirement', 'business_rule',
      'interface', 'data_shape', 'acceptance_criterion', 'edge_case',
    ]),
    target: new Set(['architecture_decision']),
  },
  demonstrated_by: {
    source: new Set([
      'user_story', 'functional_requirement', 'quality_requirement',
      'business_rule', 'edge_case',
    ]),
    target: new Set(['acceptance_criterion']),
  },
  verified_by: {
    source: new Set([
      'acceptance_criterion', 'functional_requirement', 'quality_requirement',
      'business_rule', 'edge_case', 'architecture_decision', 'external_risk',
    ]),
    target: new Set([
      'test_case', 'external_manual_check', 'external_review_check',
      'external_command',
    ]),
  },
  mitigates: {
    source: new Set([
      'functional_requirement', 'quality_requirement', 'business_rule',
      'architecture_decision', 'acceptance_criterion', 'edge_case', 'test_case',
    ]),
    target: new Set(['external_risk', 'edge_case', 'quality_requirement']),
  },
};

function usageError(message) {
  process.stderr.write(`error: ${message}\n`);
  process.stderr.write('usage: node dev/planning-forge/scripts/validate-metamodel.mjs <artifact.(json|yaml|yml)> [--schema <schema.json>]\n');
  process.exit(2);
}

function stablePrefix(id) {
  const match = STABLE_ID_RE.exec(id);
  return match ? match[2] : null;
}

function stableNamespace(id) {
  const match = STABLE_ID_RE.exec(id);
  return match && match[1] ? match[1].slice(0, -1) : null;
}

function isExternalRef(ref) {
  return EXTERNAL_REF_RE.test(ref);
}

function refType(ref, nodeTypes) {
  if (nodeTypes.has(ref)) return nodeTypes.get(ref);
  if (ref === 'Goal') return 'external_goal';
  if (ref === 'In Scope') return 'external_scope';
  if (ref.startsWith('risk: ')) return 'external_risk';
  if (ref.startsWith('manual check: ')) return 'external_manual_check';
  if (ref.startsWith('review check: ')) return 'external_review_check';
  if (ref.startsWith('command: ')) return 'external_command';
  return null;
}

function checkRelationshipCompatibility(edge, index, nodeTypes, errors) {
  const rule = RELATIONSHIP_RULES[edge.relationship];
  if (!rule) return;

  const sourceType = refType(edge.source, nodeTypes);
  const targetType = refType(edge.target, nodeTypes);
  if (sourceType && !rule.source.has(sourceType)) {
    errors.push(
      `edges[${index}]: relationship ${edge.relationship} does not allow source ${edge.source} (${sourceType})`,
    );
  }
  if (targetType && !rule.target.has(targetType)) {
    errors.push(
      `edges[${index}]: relationship ${edge.relationship} does not allow target ${edge.target} (${targetType})`,
    );
  }
}

function hasEvidence(node) {
  return Array.isArray(node.evidence) && node.evidence.length > 0;
}

function validateNodeProvenance(node, nodeIds, errors) {
  const allowedClaimKinds = CLAIM_KINDS_BY_TYPE[node.type];
  if (allowedClaimKinds) {
    if (!node.claim_kind) {
      errors.push(`${node.id}: ${node.type} requires claim_kind`);
    } else if (!allowedClaimKinds.has(node.claim_kind)) {
      errors.push(`${node.id}: claim_kind ${node.claim_kind} does not match ${node.type}`);
    }
  }

  if (node.source && !node.confidence) {
    errors.push(`${node.id}: source requires confidence`);
  }
  if (node.confidence && !node.source) {
    errors.push(`${node.id}: confidence requires source`);
  }

  if (node.type === 'assumption') {
    if (!node.source) errors.push(`${node.id}: assumption requires source`);
    if (!node.confidence) errors.push(`${node.id}: assumption requires confidence`);
    if (!Array.isArray(node.impact_if_false) || node.impact_if_false.length === 0) {
      errors.push(`${node.id}: assumption requires impact_if_false`);
    }
  }

  for (const [index, impact] of (node.impact_if_false || []).entries()) {
    if (impact.trim().length === 0) {
      errors.push(`${node.id}: impact_if_false[${index}] is blank`);
    }
  }

  if (REQUIRED_EVIDENCE_SOURCES.has(node.source) && !hasEvidence(node)) {
    errors.push(`${node.id}: source ${node.source} requires evidence`);
  }

  for (const [index, evidence] of (node.evidence || []).entries()) {
    if (evidence.ref.trim().length === 0) {
      errors.push(`${node.id}: evidence[${index}].ref is blank`);
    }
    if (evidence.kind === 'node') {
      if (!STABLE_ID_RE.test(evidence.ref)) {
        errors.push(`${node.id}: evidence[${index}] node ref must be a stable ID`);
      } else if (!nodeIds.has(evidence.ref)) {
        errors.push(`${node.id}: evidence[${index}] references missing node ${evidence.ref}`);
      }
    }
  }
}

function validateSemantics(artifact) {
  const errors = [];
  const nodeIds = new Set();
  const nodeTypes = new Map();

  for (const node of artifact.nodes || []) {
    if (nodeIds.has(node.id)) {
      errors.push(`duplicate node id: ${node.id}`);
    }
    nodeIds.add(node.id);
    nodeTypes.set(node.id, node.type);

    const prefix = stablePrefix(node.id);
    if (!prefix) {
      errors.push(`invalid stable id: ${node.id}`);
      continue;
    }
    const namespace = stableNamespace(node.id);
    if (artifact.id_namespace === null || artifact.id_namespace === undefined) {
      if (namespace !== null) {
        errors.push(`${node.id}: namespaced id requires id_namespace ${namespace}`);
      }
    } else if (namespace !== artifact.id_namespace) {
      errors.push(`${node.id}: namespace ${namespace ?? 'none'} does not match id_namespace ${artifact.id_namespace}`);
    }
    if (!TYPE_BY_PREFIX[prefix]?.has(node.type)) {
      errors.push(`${node.id}: type ${node.type} does not match ${prefix}- prefix`);
    }
  }

  for (const node of artifact.nodes || []) {
    validateNodeProvenance(node, nodeIds, errors);
  }

  for (const [index, edge] of (artifact.edges || []).entries()) {
    for (const endpoint of ['source', 'target']) {
      const ref = edge[endpoint];
      if (STABLE_ID_RE.test(ref)) {
        if (!nodeIds.has(ref)) {
          errors.push(`edges[${index}].${endpoint} references missing node ${ref}`);
        }
      } else if (!isExternalRef(ref)) {
        errors.push(`edges[${index}].${endpoint} has invalid external reference ${JSON.stringify(ref)}`);
      }
    }
    if (edge.source === edge.target) {
      errors.push(`edges[${index}] points ${edge.source} to itself`);
    }
    checkRelationshipCompatibility(edge, index, nodeTypes, errors);
  }

  return errors;
}

function main() {
  const { values: args, error } = parseArgs(process.argv.slice(2), ARG_SPEC);
  if (error) usageError(error);

  const artifactPath = resolve(args.artifact);
  const schemaPath = resolve(args.schema);
  if (!existsSync(artifactPath) || !statSync(artifactPath).isFile()) {
    usageError(`artifact file not found: ${artifactPath}`);
  }
  if (!existsSync(schemaPath) || !statSync(schemaPath).isFile()) {
    usageError(`schema file not found: ${schemaPath}`);
  }

  let artifact;
  try {
    artifact = loadArtifact(artifactPath);
  } catch (err) {
    usageError(err.message);
  }
  if (artifact === null || typeof artifact !== 'object' || Array.isArray(artifact)) {
    process.stderr.write('Planning Forge metamodel validation failed:\n- artifact root must be a mapping/object\n');
    process.exit(1);
  }

  const errors = [];
  try {
    const loaded = loadSchema(schemaPath);
    errors.push(...validate(artifact, loaded));
  } catch (err) {
    usageError(`could not load schema: ${err.message}`);
  }
  if (errors.length === 0) {
    errors.push(...validateSemantics(artifact));
  }

  if (errors.length > 0) {
    process.stderr.write('Planning Forge metamodel validation failed:\n');
    for (const err of errors) process.stderr.write(`- ${err}\n`);
    process.exit(1);
  }

  process.stdout.write(
    `Planning Forge metamodel validation passed: ${artifactPath} (${artifact.nodes.length} nodes, ${artifact.edges.length} edges)\n`,
  );
}

main();