// Build an OSLC RDF/XML document from a validated Planning Forge metamodel
// artifact.
//
// This is a one-way export (publish): it serializes the canonical model into
// OSLC resources for consumption by ALM/OSLC tools. It does not import RDF back
// into the metamodel. The mapping follows the recorded design note in
// `planning-forge/shared/metamodel-export-mapping.md`:
//   - node                 -> rdf:Description (OSLC resource)
//   - node type            -> rdf:type (oslc_rm:Requirement / oslc_am:Resource /
//                             oslc_qm:TestCase)
//   - typed edge           -> a link predicate on the source resource
//   - provenance           -> dcterms:source, pf:confidence, prov:wasInfluencedBy
//
// Canonical edge direction is preserved: each edge becomes exactly one RDF
// triple. Two relationships (`derives_from`, `refines`) map to standard OSLC
// predicates whose natural reading is the reverse of the edge direction
// (`oslc_rm:elaboratedBy`, `oslc_rm:decomposedBy`); for those, the single triple
// is emitted with subject and object swapped so the standard predicate stays
// semantically correct. No duplicate reverse links are materialized.
//
// External edge endpoints (Goal, In Scope, risk:, manual check:, review check:,
// command:) are not metamodel nodes, so each distinct one becomes a minimal
// pf:External resource with a synthetic IRI, keeping every edge expressible.

const PF_NS = 'https://github.com/sjinks/ai-plugins/planning-forge/ns#';
const DEFAULT_BASE = 'urn:planning-forge:';

const NAMESPACES = {
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  dcterms: 'http://purl.org/dc/terms/',
  oslc: 'http://open-services.net/ns/core#',
  oslc_rm: 'http://open-services.net/ns/rm#',
  oslc_qm: 'http://open-services.net/ns/qm#',
  oslc_am: 'http://open-services.net/ns/am#',
  prov: 'http://www.w3.org/ns/prov#',
  pf: PF_NS,
};

// Node type -> rdf:type IRI.
const TYPE_IRI = {
  user_story: 'http://open-services.net/ns/rm#Requirement',
  business_rule: 'http://open-services.net/ns/rm#Requirement',
  functional_requirement: 'http://open-services.net/ns/rm#Requirement',
  quality_requirement: 'http://open-services.net/ns/rm#Requirement',
  interface: 'http://open-services.net/ns/rm#Requirement',
  data_shape: 'http://open-services.net/ns/rm#Requirement',
  acceptance_criterion: 'http://open-services.net/ns/rm#Requirement',
  edge_case: 'http://open-services.net/ns/rm#Requirement',
  assumption: 'http://open-services.net/ns/rm#Requirement',
  architecture_decision: 'http://open-services.net/ns/am#Resource',
  test_case: 'http://open-services.net/ns/qm#TestCase',
};

// Relationship -> { predicate QName, reverse }. `reverse: true` means the
// standard OSLC predicate reads opposite to the edge direction, so the single
// emitted triple swaps subject and object.
const RELATIONSHIP_PREDICATE = {
  derives_from: { qname: 'oslc_rm:elaboratedBy', reverse: true },
  satisfies: { qname: 'oslc_rm:satisfies', reverse: false },
  refines: { qname: 'oslc_rm:decomposedBy', reverse: true },
  constrains: { qname: 'pf:constrains', reverse: false },
  conflicts_with: { qname: 'pf:conflictsWith', reverse: false },
  depends_on: { qname: 'pf:dependsOn', reverse: false },
  supersedes: { qname: 'dcterms:replaces', reverse: false },
  realized_by: { qname: 'oslc_am:elaboratedBy', reverse: false },
  demonstrated_by: { qname: 'pf:demonstratedBy', reverse: false },
  verified_by: { qname: 'oslc_rm:validatedBy', reverse: false },
  mitigates: { qname: 'pf:mitigates', reverse: false },
};

// Remove characters outside the XML 1.0 Char production and lone surrogates
// while preserving valid supplementary-plane characters. `for...of` iterates by
// code point, so a valid surrogate pair yields its astral scalar (kept) and an
// unpaired surrogate yields a code unit that fails every legality branch.
function stripIllegalXmlChars(text) {
  let out = '';
  for (const ch of String(text)) {
    const cp = ch.codePointAt(0);
    const legal =
      cp === 0x9 || cp === 0xa || cp === 0xd ||
      (cp >= 0x20 && cp <= 0xd7ff) ||
      (cp >= 0xe000 && cp <= 0xfffd) ||
      (cp >= 0x10000 && cp <= 0x10ffff);
    if (legal) out += ch;
  }
  return out;
}

function escapeText(value) {
  return stripIllegalXmlChars(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(value) {
  // Encode significant whitespace as numeric character references so XML
  // attribute-value normalization does not collapse newlines/tabs/CR to spaces
  // on read-back. IRIs never contain these, but node-supplied values could.
  return stripIllegalXmlChars(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\t/g, '&#9;')
    .replace(/\n/g, '&#10;')
    .replace(/\r/g, '&#13;');
}

function nodeFieldValue(value) {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) return value.join('; ');
  return String(value);
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function indexArtifact(artifact, base) {
  const nodes = Array.isArray(artifact.nodes) ? artifact.nodes : [];
  const edges = Array.isArray(artifact.edges) ? artifact.edges.filter(isRecord) : [];
  const nodeIds = new Set(nodes.map((n) => n.id));

  const externals = new Map(); // ref -> synthetic IRI
  let externalCounter = 0;
  for (const edge of edges) {
    for (const endpoint of [edge.source, edge.target]) {
      if (typeof endpoint !== 'string') continue;
      if (!nodeIds.has(endpoint) && !externals.has(endpoint)) {
        externalCounter += 1;
        externals.set(endpoint, `${base}external:${externalCounter}`);
      }
    }
  }
  return { nodes, edges, nodeIds, externals };
}

function externalKind(ref) {
  if (ref === 'Goal') return 'external_goal';
  if (ref === 'In Scope') return 'external_scope';
  if (ref.startsWith('risk: ')) return 'external_risk';
  if (ref.startsWith('manual check: ')) return 'external_manual_check';
  if (ref.startsWith('review check: ')) return 'external_review_check';
  if (ref.startsWith('command: ')) return 'external_command';
  return 'external_unknown';
}

function literal(qname, value, indent) {
  return `${indent}<${qname}>${escapeText(value)}</${qname}>`;
}

function resourceRef(qname, iri, indent) {
  return `${indent}<${qname} rdf:resource="${escapeAttr(iri)}"/>`;
}

function renderNode(node, base, links, nodeIds) {
  const iri = `${base}${node.id}`;
  const indent = '    ';
  const lines = [`  <rdf:Description rdf:about="${escapeAttr(iri)}">`];
  lines.push(resourceRef('rdf:type', TYPE_IRI[node.type] || TYPE_IRI.functional_requirement, indent));
  lines.push(literal('dcterms:identifier', node.id, indent));
  lines.push(literal('dcterms:title', nodeFieldValue(node.title) ?? node.id, indent));
  const statement = nodeFieldValue(node.statement);
  if (statement !== undefined) lines.push(literal('dcterms:description', statement, indent));

  const simple = [
    ['pf:status', node.status],
    ['pf:claimKind', node.claim_kind],
    ['pf:obligation', node.obligation],
    ['pf:confidence', node.confidence],
    ['dcterms:source', node.source],
    ['pf:rationale', node.rationale],
    ['pf:owner', node.owner],
  ];
  for (const [qname, raw] of simple) {
    const value = nodeFieldValue(raw);
    if (value !== undefined) lines.push(literal(qname, value, indent));
  }

  for (const impact of Array.isArray(node.impact_if_false) ? node.impact_if_false : []) {
    lines.push(literal('pf:impactIfFalse', impact, indent));
  }

  // Evidence: a node ref that resolves to a real resource becomes an
  // intra-document prov link; other kinds (or an unresolved node ref on an
  // unvalidated artifact) are recorded as literals so nothing is silently
  // dropped and no dangling link target is emitted.
  for (const ev of Array.isArray(node.evidence) ? node.evidence : []) {
    if (!ev || typeof ev !== 'object') continue;
    if (ev.kind === 'node' && nodeIds.has(ev.ref)) {
      lines.push(resourceRef('prov:wasInfluencedBy', `${base}${ev.ref}`, indent));
    } else {
      lines.push(literal('pf:evidence', `${ev.kind}: ${ev.ref}`, indent));
    }
  }

  for (const link of links.get(iri) || []) {
    lines.push(resourceRef(link.qname, link.objectIri, indent));
  }

  lines.push('  </rdf:Description>');
  return lines.join('\n');
}

function renderExternal(ref, iri, links) {
  const indent = '    ';
  const lines = [`  <rdf:Description rdf:about="${escapeAttr(iri)}">`];
  lines.push(resourceRef('rdf:type', `${PF_NS}External`, indent));
  lines.push(literal('dcterms:title', ref, indent));
  lines.push(literal('pf:externalKind', externalKind(ref), indent));
  for (const link of links.get(iri) || []) {
    lines.push(resourceRef(link.qname, link.objectIri, indent));
  }
  lines.push('  </rdf:Description>');
  return lines.join('\n');
}

/**
 * Build an OSLC RDF/XML document string from a metamodel artifact.
 * Options: { base } sets the resource IRI prefix (default `urn:planning-forge:`).
 */
export function buildOslc(artifact, options = {}) {
  if (artifact === null || typeof artifact !== 'object' || Array.isArray(artifact)) {
    throw new Error('artifact must be a mapping/object');
  }
  const base = options.base || DEFAULT_BASE;
  const { nodes, edges, nodeIds, externals } = indexArtifact(artifact, base);

  const iriFor = (ref) => (nodeIds.has(ref) ? `${base}${ref}` : externals.get(ref));

  // Group each edge's single link triple under its subject IRI, applying the
  // reverse swap for predicates whose OSLC reading is inverted.
  const links = new Map();
  for (const edge of edges) {
    const mapping = RELATIONSHIP_PREDICATE[edge.relationship];
    if (!mapping) continue;
    const [subjectRef, objectRef] = mapping.reverse
      ? [edge.target, edge.source]
      : [edge.source, edge.target];
    const subjectIri = iriFor(subjectRef);
    const objectIri = iriFor(objectRef);
    if (!subjectIri || !objectIri) continue;
    if (!links.has(subjectIri)) links.set(subjectIri, []);
    links.get(subjectIri).push({ qname: mapping.qname, objectIri });
  }

  const nsDecls = Object.entries(NAMESPACES)
    .map(([prefix, uri]) => `         xmlns:${prefix}="${escapeAttr(uri)}"`)
    .join('\n');

  const resources = [
    ...nodes.map((node) => renderNode(node, base, links, nodeIds)),
    ...[...externals.entries()].map(([ref, iri]) => renderExternal(ref, iri, links)),
  ];

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<rdf:RDF\n${nsDecls}>`,
    ...resources,
    '</rdf:RDF>',
  ];
  return `${lines.join('\n')}\n`;
}
