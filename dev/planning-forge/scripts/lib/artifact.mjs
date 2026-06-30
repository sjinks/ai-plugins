// Shared helpers for loading and indexing Planning Forge metamodel artifacts.
//
// A metamodel artifact may be authored as JSON (`.json`) or YAML (`.yaml` /
// `.yml`). JSON remains the validated canonical format; YAML is accepted as an
// authoring convenience and is parsed into the same in-memory shape.

import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import { parseYaml } from './yaml.mjs';

export const STABLE_ID_RE =
  /^([A-Z]{1,8}-)?(US|RULE|FR|NFR|INT|AC|EDGE|ASM|D|TC)-[1-9][0-9]*$/;

export const EXTERNAL_REF_RE =
  /^(Goal|In Scope|risk: .+|manual check: .+|review check: .+|command: .+)$/;

/**
 * Load a metamodel artifact from a path, dispatching on file extension.
 * Returns the parsed object. Throws on parse errors with the file path.
 */
export function loadArtifact(path) {
  const text = readFileSync(path, 'utf8');
  const ext = extname(path).toLowerCase();
  if (ext === '.yaml' || ext === '.yml') {
    try {
      return parseYaml(text);
    } catch (err) {
      throw new Error(`${path}: ${err.message}`);
    }
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`${path}: JSON parse error: ${err.message}`);
  }
}

/** True when ref is a stable node ID (optionally namespaced). */
export function isStableId(ref) {
  return typeof ref === 'string' && STABLE_ID_RE.test(ref);
}

/** True when ref is an allowed external (non-stable-ID) endpoint label. */
export function isExternalRef(ref) {
  return typeof ref === 'string' && EXTERNAL_REF_RE.test(ref);
}

/**
 * Build adjacency indexes for an artifact's edges.
 * Returns { nodesById, outgoing, incoming } where outgoing/incoming map a
 * node id to an array of { relationship, other } records.
 */
export function indexArtifact(artifact) {
  const nodesById = new Map();
  for (const node of artifact.nodes || []) {
    if (node && typeof node === 'object' && typeof node.id === 'string') {
      nodesById.set(node.id, node);
    }
  }

  const outgoing = new Map();
  const incoming = new Map();
  for (const edge of artifact.edges || []) {
    if (!edge || typeof edge !== 'object') continue;
    const { source, relationship, target } = edge;
    if (!outgoing.has(source)) outgoing.set(source, []);
    outgoing.get(source).push({ relationship, other: target });
    if (!incoming.has(target)) incoming.set(target, []);
    incoming.get(target).push({ relationship, other: source });
  }

  return { nodesById, outgoing, incoming };
}
