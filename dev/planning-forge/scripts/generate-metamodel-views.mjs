#!/usr/bin/env node
// Generate human-readable views from a validated Planning Forge metamodel artifact.
//
// Views are derived projections of the canonical machine-readable model; the
// JSON/YAML artifact remains the source of truth. This script never edits the
// artifact and never invents edges that are not present in the model.
//
// Usage:
//   node dev/planning-forge/scripts/generate-metamodel-views.mjs <artifact.(json|yaml|yml)> [--view markdown|matrix|mermaid|all] [--out <file>]
//
// Views:
//   markdown  Node summary grouped by type, plus the traceability matrix.
//   matrix    Only the traceability matrix (per-node outgoing typed edges).
//   mermaid   Mermaid flowchart of the typed edge graph.
//   all       markdown + mermaid (default).
//
// Exit codes:
//   0 = view written
//   2 = invalid usage or missing/unparseable artifact

import { existsSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from '../../../code-explorer/scripts/lib/cli.mjs';
import { loadArtifact } from './lib/artifact.mjs';

const ARG_SPEC = {
  positionals: [{ name: 'artifact', required: true }],
  flags: {
    '--view': { type: 'value', default: 'all' },
    '--out': { type: 'value', default: '' },
  },
};

const VIEWS = new Set(['markdown', 'matrix', 'mermaid', 'all']);

const TYPE_LABELS = {
  user_story: 'User Stories',
  business_rule: 'Business Rules',
  functional_requirement: 'Functional Requirements',
  quality_requirement: 'Quality Requirements',
  interface: 'Interfaces',
  data_shape: 'Data Shapes',
  acceptance_criterion: 'Acceptance Criteria',
  edge_case: 'Edge Cases',
  assumption: 'Assumptions',
  architecture_decision: 'Architecture Decisions',
  test_case: 'Test Cases',
};

const TYPE_ORDER = Object.keys(TYPE_LABELS);

function usageError(message) {
  process.stderr.write(`error: ${message}\n`);
  process.stderr.write(
    'usage: node dev/planning-forge/scripts/generate-metamodel-views.mjs <artifact.(json|yaml|yml)> [--view markdown|matrix|mermaid|all] [--out <file>]\n',
  );
  process.exit(2);
}

// Escape a value for safe inclusion in a Markdown table cell or list item:
// collapse newlines, and neutralize pipes and inline-formatting characters so
// untrusted titles/labels cannot break or inject Markdown structure.
function escapeCell(text) {
  return String(text)
    .replace(/\r?\n/g, ' ')
    .replace(/([\\`*_[\]<>|])/g, '\\$1');
}

function nodeTitle(node) {
  return node.title || node.statement || node.id;
}

function renderNodeSummary(artifact) {
  const lines = ['## Nodes', ''];
  const byType = new Map();
  for (const node of artifact.nodes || []) {
    if (!byType.has(node.type)) byType.set(node.type, []);
    byType.get(node.type).push(node);
  }
  for (const type of TYPE_ORDER) {
    const nodes = byType.get(type);
    if (!nodes || nodes.length === 0) continue;
    lines.push(`### ${TYPE_LABELS[type]}`, '');
    for (const node of nodes) {
      const claim = node.claim_kind ? ` _(${escapeCell(node.claim_kind)})_` : '';
      lines.push(`- **${escapeCell(node.id)}** ${escapeCell(nodeTitle(node))}${claim} — status: \`${node.status}\``);
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

function renderMatrix(artifact) {
  // Drive the matrix from the edge list so every present edge appears, even if
  // an endpoint is an external label or (in an unvalidated artifact) a stable
  // ID with no matching node. The view never invents edges, but it also never
  // silently drops one that exists.
  const lines = ['## Traceability Matrix', '', '| Source | Relationship | Target |', '| --- | --- | --- |'];
  const edges = artifact.edges || [];
  for (const edge of edges) {
    // relationship is a controlled-vocabulary identifier; render it verbatim in
    // a code span. source/target may be external labels, so escape those.
    lines.push(`| ${escapeCell(edge.source)} | \`${edge.relationship}\` | ${escapeCell(edge.target)} |`);
  }
  if (edges.length === 0) {
    lines.push('| _none_ | | |');
  }
  return lines.join('\n');
}

function mermaidId(ref, idMap) {
  if (idMap.has(ref)) return idMap.get(ref);
  const safe = `N${idMap.size}`;
  idMap.set(ref, safe);
  return safe;
}

// Mermaid uses HTML entities, not backslash escapes; neutralize quotes and the
// structural characters that would break a node label or the diagram.
function mermaidLabel(ref) {
  return String(ref)
    .replace(/\r?\n/g, ' ')
    .replace(/"/g, '#quot;')
    .replace(/[[\]{}<>|]/g, ' ')
    .trim();
}

// Mermaid edge labels cannot contain unescaped pipes or angle brackets.
function mermaidEdgeLabel(relationship) {
  return String(relationship).replace(/[^A-Za-z0-9_]/g, '_');
}

function renderMermaid(artifact) {
  const idMap = new Map();
  const lines = ['## Diagram', '', '```mermaid', 'flowchart TD'];
  const endpoints = new Set();
  for (const edge of artifact.edges || []) {
    endpoints.add(edge.source);
    endpoints.add(edge.target);
  }
  for (const ref of endpoints) {
    lines.push(`  ${mermaidId(ref, idMap)}["${mermaidLabel(ref)}"]`);
  }
  for (const edge of artifact.edges || []) {
    const s = mermaidId(edge.source, idMap);
    const t = mermaidId(edge.target, idMap);
    lines.push(`  ${s} -- ${mermaidEdgeLabel(edge.relationship)} --> ${t}`);
  }
  lines.push('```');
  if (endpoints.size === 0) {
    return ['## Diagram', '', '_No edges to render._'].join('\n');
  }
  return lines.join('\n');
}

function renderTitle(artifact) {
  const title = artifact.title || 'Planning Forge artifact';
  return [`# ${title}`, '', `_Generated view — source of truth is the machine-readable artifact (\`${artifact.artifact_type}\`, schema ${artifact.schema_version})._`].join('\n');
}

function main() {
  const { values: args, error } = parseArgs(process.argv.slice(2), ARG_SPEC);
  if (error) usageError(error);

  const view = args.view;
  if (!VIEWS.has(view)) usageError(`unknown view: ${view}`);

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

  const sections = [renderTitle(artifact)];
  if (view === 'markdown' || view === 'all') {
    sections.push(renderNodeSummary(artifact));
    sections.push(renderMatrix(artifact));
  } else if (view === 'matrix') {
    sections.push(renderMatrix(artifact));
  }
  if (view === 'mermaid' || view === 'all') {
    sections.push(renderMermaid(artifact));
  }

  const output = `${sections.join('\n\n')}\n`;
  if (args.out) {
    const outPath = resolve(args.out);
    try {
      writeFileSync(outPath, output);
    } catch (err) {
      usageError(`could not write ${args.out}: ${err.message}`);
    }
    process.stdout.write(`Planning Forge view written: ${outPath} (view: ${view})\n`);
  } else {
    process.stdout.write(output);
  }
}

main();
