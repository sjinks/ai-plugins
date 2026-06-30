// Build a ReqIF 1.0 interchange document from a validated Planning Forge
// metamodel artifact.
//
// This is a one-way export (publish): it serializes the canonical model into
// ReqIF for consumption by requirements/ALM tools. It does not import ReqIF
// back into the metamodel. The mapping follows the recorded design note in
// `planning-forge/shared/metamodel-export-mapping.md`:
//   - node                  -> SPEC-OBJECT
//   - node type             -> SPEC-OBJECT-TYPE
//   - typed edge            -> SPEC-RELATION (canonical direction preserved)
//   - edge relationship     -> SPEC-RELATION-TYPE
//   - status / claim_kind / obligation / confidence -> enumeration datatypes
//   - title / statement / id / provenance fields    -> string attributes
//
// External edge endpoints (Goal, In Scope, risk:, manual check:, review check:,
// command:) are not metamodel nodes, so each distinct one is materialized as a
// SPEC-OBJECT of a dedicated "external" type to keep every edge expressible as
// a SPEC-RELATION without inventing reverse links.

const REQIF_NS = 'http://www.omg.org/spec/ReqIF/20110401/reqif.xsd';

const NODE_TYPES = [
  'user_story',
  'business_rule',
  'functional_requirement',
  'quality_requirement',
  'interface',
  'data_shape',
  'acceptance_criterion',
  'edge_case',
  'assumption',
  'architecture_decision',
  'test_case',
];

const RELATIONSHIPS = [
  'derives_from',
  'satisfies',
  'refines',
  'constrains',
  'conflicts_with',
  'depends_on',
  'supersedes',
  'realized_by',
  'demonstrated_by',
  'verified_by',
  'mitigates',
];

const ENUMS = {
  status: ['draft', 'proposed', 'approved', 'confirmed', 'unconfirmed', 'rejected', 'deferred', 'superseded', 'removed', 'out_of_scope'],
  claim_kind: ['fact', 'assumption', 'decision', 'recommendation', 'requirement', 'verification', 'contract'],
  obligation: ['must', 'should', 'may'],
  confidence: ['low', 'medium', 'high'],
};

// Per-type attribute set. `kind` is 'string' or an ENUMS key; `field` is the
// node property the value is read from (null for the synthetic identifier).
const NODE_ATTRIBUTES = [
  { key: 'name', longName: 'ReqIF.Name', kind: 'string', field: 'title' },
  { key: 'text', longName: 'ReqIF.Text', kind: 'string', field: 'statement' },
  { key: 'identifier', longName: 'PF.Identifier', kind: 'string', field: 'id' },
  { key: 'status', longName: 'PF.Status', kind: 'status', field: 'status' },
  { key: 'claim_kind', longName: 'PF.ClaimKind', kind: 'claim_kind', field: 'claim_kind' },
  { key: 'obligation', longName: 'PF.Obligation', kind: 'obligation', field: 'obligation' },
  { key: 'confidence', longName: 'PF.Confidence', kind: 'confidence', field: 'confidence' },
  { key: 'source', longName: 'PF.Source', kind: 'string', field: 'source' },
  { key: 'rationale', longName: 'PF.Rationale', kind: 'string', field: 'rationale' },
  { key: 'owner', longName: 'PF.Owner', kind: 'string', field: 'owner' },
  { key: 'impact_if_false', longName: 'PF.ImpactIfFalse', kind: 'string', field: 'impact_if_false' },
];

const EXTERNAL_ATTRIBUTES = [
  { key: 'name', longName: 'ReqIF.Name', kind: 'string' },
  { key: 'identifier', longName: 'PF.Identifier', kind: 'string' },
  { key: 'kind', longName: 'PF.ExternalKind', kind: 'string' },
];

// Remove characters not permitted by the XML 1.0 Char production and any lone
// surrogate code units. Tab (\t), newline (\n), and carriage return (\r) are
// legal and are preserved here (attribute encoding handles them separately).
// Without this, a schema-valid free-text field containing a control character
// (the schema only checks minLength, not a pattern) would yield non-well-formed
// XML that conformant ReqIF parsers reject.
function stripIllegalXmlChars(text) {
  let out = '';
  // `for...of` iterates by code point: a valid surrogate pair yields its single
  // astral scalar (cp >= 0x10000, kept intact), while an unpaired surrogate
  // yields a code unit whose codePointAt is in 0xD800-0xDFFF and fails every
  // legality branch below, so lone surrogates are dropped without a separate
  // surrogate-stripping pass (which would also delete valid pairs).
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

function escapeXml(value) {
  return stripIllegalXmlChars(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(value) {
  // Encode significant whitespace as numeric character references so XML
  // attribute-value normalization does not collapse newlines/tabs/CR to spaces
  // when the value is read back (text-bearing fields are emitted as attributes).
  return stripIllegalXmlChars(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\t/g, '&#9;')
    .replace(/\n/g, '&#10;')
    .replace(/\r/g, '&#13;');
}

function idPart(value) {
  return String(value).replace(/[^A-Za-z0-9_-]/g, '-');
}

// Classify an external edge endpoint label into its metamodel external kind.
function externalKind(ref) {
  if (ref === 'Goal') return 'external_goal';
  if (ref === 'In Scope') return 'external_scope';
  if (ref.startsWith('risk: ')) return 'external_risk';
  if (ref.startsWith('manual check: ')) return 'external_manual_check';
  if (ref.startsWith('review check: ')) return 'external_review_check';
  if (ref.startsWith('command: ')) return 'external_command';
  return 'external_unknown';
}

function enumValueId(datatype, value) {
  return `_ev-${datatype}-${idPart(value)}`;
}

function nodeAttrDefId(type, key) {
  return `_ad-${type}-${key}`;
}

function specObjectId(id) {
  return `_so-${idPart(id)}`;
}

// Collect the set of node types in use and the distinct external endpoints, so
// only the spec types and objects that are actually referenced get emitted.
function indexArtifact(artifact) {
  const nodes = Array.isArray(artifact.nodes) ? artifact.nodes : [];
  const edges = Array.isArray(artifact.edges) ? artifact.edges : [];
  const nodeIds = new Set(nodes.map((n) => n.id));
  const usedNodeTypes = new Set(nodes.map((n) => n.type).filter((t) => NODE_TYPES.includes(t)));

  // External endpoint object ids live in a distinct `_so-x-` namespace so they
  // can never collide with a node-derived `_so-<id>` identifier (node ids are
  // constrained to the stable-ID pattern, but the separate namespace keeps the
  // guarantee explicit and robust to future id shapes).
  const externals = new Map(); // ref -> generated spec-object id
  let externalCounter = 0;
  for (const edge of edges) {
    for (const endpoint of [edge.source, edge.target]) {
      if (!nodeIds.has(endpoint) && !externals.has(endpoint)) {
        externalCounter += 1;
        externals.set(endpoint, `_so-x-${externalCounter}`);
      }
    }
  }

  return { nodes, edges, nodeIds, usedNodeTypes, externals };
}

function renderEnumDatatype(datatype, lastChange) {
  const values = ENUMS[datatype]
    .map((value, index) => {
      return [
        `        <ENUM-VALUE IDENTIFIER="${enumValueId(datatype, value)}" LONG-NAME="${escapeAttr(value)}" LAST-CHANGE="${lastChange}">`,
        '          <PROPERTIES>',
        `            <EMBEDDED-VALUE KEY="${index}" OTHER-CONTENT=""/>`,
        '          </PROPERTIES>',
        '        </ENUM-VALUE>',
      ].join('\n');
    })
    .join('\n');
  return [
    `      <DATATYPE-DEFINITION-ENUMERATION IDENTIFIER="_dt-${datatype}" LONG-NAME="${datatype}" LAST-CHANGE="${lastChange}">`,
    '        <SPECIFIED-VALUES>',
    values,
    '        </SPECIFIED-VALUES>',
    '      </DATATYPE-DEFINITION-ENUMERATION>',
  ].join('\n');
}

function renderAttributeDefinition(idfn, attr, lastChange) {
  if (attr.kind === 'string') {
    return [
      `        <ATTRIBUTE-DEFINITION-STRING IDENTIFIER="${idfn(attr.key)}" LONG-NAME="${escapeAttr(attr.longName)}" LAST-CHANGE="${lastChange}">`,
      '          <TYPE>',
      '            <DATATYPE-DEFINITION-STRING-REF>_dt-string</DATATYPE-DEFINITION-STRING-REF>',
      '          </TYPE>',
      '        </ATTRIBUTE-DEFINITION-STRING>',
    ].join('\n');
  }
  return [
    `        <ATTRIBUTE-DEFINITION-ENUMERATION IDENTIFIER="${idfn(attr.key)}" LONG-NAME="${escapeAttr(attr.longName)}" MULTI-VALUED="false" LAST-CHANGE="${lastChange}">`,
    '          <TYPE>',
    `            <DATATYPE-DEFINITION-ENUMERATION-REF>_dt-${attr.kind}</DATATYPE-DEFINITION-ENUMERATION-REF>`,
    '          </TYPE>',
    '        </ATTRIBUTE-DEFINITION-ENUMERATION>',
  ].join('\n');
}

function renderSpecObjectType(type, lastChange) {
  const defs = NODE_ATTRIBUTES
    .map((attr) => renderAttributeDefinition((key) => nodeAttrDefId(type, key), attr, lastChange))
    .join('\n');
  return [
    `      <SPEC-OBJECT-TYPE IDENTIFIER="_sot-${type}" LONG-NAME="${type}" LAST-CHANGE="${lastChange}">`,
    '        <SPEC-ATTRIBUTES>',
    defs,
    '        </SPEC-ATTRIBUTES>',
    '      </SPEC-OBJECT-TYPE>',
  ].join('\n');
}

function renderExternalType(lastChange) {
  const defs = EXTERNAL_ATTRIBUTES
    .map((attr) => renderAttributeDefinition((key) => `_ad-external-${key}`, attr, lastChange))
    .join('\n');
  return [
    `      <SPEC-OBJECT-TYPE IDENTIFIER="_sot-external" LONG-NAME="external" LAST-CHANGE="${lastChange}">`,
    '        <SPEC-ATTRIBUTES>',
    defs,
    '        </SPEC-ATTRIBUTES>',
    '      </SPEC-OBJECT-TYPE>',
  ].join('\n');
}

function renderStringValue(defId, value) {
  return [
    `          <ATTRIBUTE-VALUE-STRING THE-VALUE="${escapeAttr(value)}">`,
    '            <DEFINITION>',
    `              <ATTRIBUTE-DEFINITION-STRING-REF>${defId}</ATTRIBUTE-DEFINITION-STRING-REF>`,
    '            </DEFINITION>',
    '          </ATTRIBUTE-VALUE-STRING>',
  ].join('\n');
}

function renderEnumValue(defId, datatype, value) {
  return [
    '          <ATTRIBUTE-VALUE-ENUMERATION>',
    '            <DEFINITION>',
    `              <ATTRIBUTE-DEFINITION-ENUMERATION-REF>${defId}</ATTRIBUTE-DEFINITION-ENUMERATION-REF>`,
    '            </DEFINITION>',
    '            <VALUES>',
    `              <ENUM-VALUE-REF>${enumValueId(datatype, value)}</ENUM-VALUE-REF>`,
    '            </VALUES>',
    '          </ATTRIBUTE-VALUE-ENUMERATION>',
  ].join('\n');
}

function nodeFieldValue(node, field) {
  const value = node[field];
  if (value === undefined || value === null) return undefined;
  if (field === 'impact_if_false') {
    if (!Array.isArray(value) || value.length === 0) return undefined;
    return value.join('; ');
  }
  if (Array.isArray(value)) return value.join('; ');
  return String(value);
}

function renderSpecObject(node, lastChange) {
  const values = [];
  for (const attr of NODE_ATTRIBUTES) {
    const raw = nodeFieldValue(node, attr.field);
    if (raw === undefined) continue;
    const defId = nodeAttrDefId(node.type, attr.key);
    if (attr.kind === 'string') {
      values.push(renderStringValue(defId, raw));
    } else if (ENUMS[attr.kind].includes(raw)) {
      values.push(renderEnumValue(defId, attr.kind, raw));
    }
  }
  return [
    `      <SPEC-OBJECT IDENTIFIER="${specObjectId(node.id)}" LONG-NAME="${escapeAttr(node.id)}" LAST-CHANGE="${lastChange}">`,
    '        <VALUES>',
    values.join('\n'),
    '        </VALUES>',
    '        <TYPE>',
    `          <SPEC-OBJECT-TYPE-REF>_sot-${node.type}</SPEC-OBJECT-TYPE-REF>`,
    '        </TYPE>',
    '      </SPEC-OBJECT>',
  ].join('\n');
}

function renderExternalObject(ref, soId, lastChange) {
  const values = [
    renderStringValue('_ad-external-name', ref),
    renderStringValue('_ad-external-identifier', ref),
    renderStringValue('_ad-external-kind', externalKind(ref)),
  ];
  return [
    `      <SPEC-OBJECT IDENTIFIER="${soId}" LONG-NAME="${escapeAttr(ref)}" LAST-CHANGE="${lastChange}">`,
    '        <VALUES>',
    values.join('\n'),
    '        </VALUES>',
    '        <TYPE>',
    '          <SPEC-OBJECT-TYPE-REF>_sot-external</SPEC-OBJECT-TYPE-REF>',
    '        </TYPE>',
    '      </SPEC-OBJECT>',
  ].join('\n');
}

function endpointRef(ref, nodeIds, externals) {
  return nodeIds.has(ref) ? specObjectId(ref) : externals.get(ref);
}

function renderSpecRelation(edge, index, nodeIds, externals, lastChange) {
  const sourceRef = endpointRef(edge.source, nodeIds, externals);
  const targetRef = endpointRef(edge.target, nodeIds, externals);
  return [
    `      <SPEC-RELATION IDENTIFIER="_sr-${index + 1}" LONG-NAME="${escapeAttr(edge.relationship)}" LAST-CHANGE="${lastChange}">`,
    '        <TYPE>',
    `          <SPEC-RELATION-TYPE-REF>_srt-${edge.relationship}</SPEC-RELATION-TYPE-REF>`,
    '        </TYPE>',
    '        <SOURCE>',
    `          <SPEC-OBJECT-REF>${sourceRef}</SPEC-OBJECT-REF>`,
    '        </SOURCE>',
    '        <TARGET>',
    `          <SPEC-OBJECT-REF>${targetRef}</SPEC-OBJECT-REF>`,
    '        </TARGET>',
    '      </SPEC-RELATION>',
  ].join('\n');
}

/**
 * Build a ReqIF 1.0 document string from a metamodel artifact.
 * Options: { now } where `now` is an ISO 8601 timestamp used for the header
 * creation time and every element's LAST-CHANGE (defaults to the current time).
 */
export function buildReqif(artifact, options = {}) {
  if (artifact === null || typeof artifact !== 'object' || Array.isArray(artifact)) {
    throw new Error('artifact must be a mapping/object');
  }
  const lastChange = options.now || new Date().toISOString();
  const { nodes, edges, nodeIds, usedNodeTypes, externals } = indexArtifact(artifact);
  const title = artifact.title || 'Planning Forge artifact';
  const headerId = `_header-${idPart(artifact.artifact_type || 'artifact')}`;

  const datatypes = [
    `      <DATATYPE-DEFINITION-STRING IDENTIFIER="_dt-string" LONG-NAME="String" MAX-LENGTH="32000" LAST-CHANGE="${lastChange}"/>`,
    ...Object.keys(ENUMS).map((dt) => renderEnumDatatype(dt, lastChange)),
  ].join('\n');

  const specObjectTypes = [...usedNodeTypes].map((type) => renderSpecObjectType(type, lastChange));
  if (externals.size > 0) specObjectTypes.push(renderExternalType(lastChange));

  const relationTypes = RELATIONSHIPS.map(
    (rel) => `      <SPEC-RELATION-TYPE IDENTIFIER="_srt-${rel}" LONG-NAME="${rel}" LAST-CHANGE="${lastChange}"/>`,
  );

  const specificationType = `      <SPECIFICATION-TYPE IDENTIFIER="_spect-default" LONG-NAME="Planning Forge Bundle" LAST-CHANGE="${lastChange}"/>`;

  const specTypes = [...specObjectTypes, ...relationTypes, specificationType].join('\n');

  const specObjects = [
    ...nodes.map((node) => renderSpecObject(node, lastChange)),
    ...[...externals.entries()].map(([ref, soId]) => renderExternalObject(ref, soId, lastChange)),
  ].join('\n');

  const specRelations = edges
    .map((edge, index) => renderSpecRelation(edge, index, nodeIds, externals, lastChange))
    .join('\n');

  const hierarchy = nodes
    .map((node, index) => {
      return [
        `        <SPEC-HIERARCHY IDENTIFIER="_sh-${index + 1}" LAST-CHANGE="${lastChange}">`,
        '          <OBJECT>',
        `            <SPEC-OBJECT-REF>${specObjectId(node.id)}</SPEC-OBJECT-REF>`,
        '          </OBJECT>',
        '        </SPEC-HIERARCHY>',
      ].join('\n');
    })
    .join('\n');

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<REQ-IF xmlns="${REQIF_NS}">`,
    '  <THE-HEADER>',
    `    <REQ-IF-HEADER IDENTIFIER="${headerId}">`,
    `      <CREATION-TIME>${lastChange}</CREATION-TIME>`,
    '      <REQ-IF-TOOL-ID>Planning Forge</REQ-IF-TOOL-ID>',
    '      <REQ-IF-VERSION>1.0</REQ-IF-VERSION>',
    '      <SOURCE-TOOL-ID>planning-forge</SOURCE-TOOL-ID>',
    `      <TITLE>${escapeXml(title)}</TITLE>`,
    '    </REQ-IF-HEADER>',
    '  </THE-HEADER>',
    '  <CORE-CONTENT>',
    '    <REQ-IF-CONTENT>',
    '      <DATATYPES>',
    datatypes,
    '      </DATATYPES>',
    '      <SPEC-TYPES>',
    specTypes,
    '      </SPEC-TYPES>',
    '      <SPEC-OBJECTS>',
    specObjects,
    '      </SPEC-OBJECTS>',
    '      <SPEC-RELATIONS>',
    specRelations,
    '      </SPEC-RELATIONS>',
    '      <SPECIFICATIONS>',
    `        <SPECIFICATION IDENTIFIER="_spec-default" LONG-NAME="${escapeAttr(title)}" LAST-CHANGE="${lastChange}">`,
    '          <TYPE>',
    '            <SPECIFICATION-TYPE-REF>_spect-default</SPECIFICATION-TYPE-REF>',
    '          </TYPE>',
    '          <CHILDREN>',
    hierarchy,
    '          </CHILDREN>',
    '        </SPECIFICATION>',
    '      </SPECIFICATIONS>',
    '    </REQ-IF-CONTENT>',
    '  </CORE-CONTENT>',
    '</REQ-IF>',
  ];

  // Drop empty container lines (e.g. no edges) to keep output tidy without
  // emitting blank lines between sibling elements.
  return `${lines.filter((line) => line !== '').join('\n')}\n`;
}
