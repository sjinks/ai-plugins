# Planning Forge Metamodel Export Mapping (ReqIF / OSLC)

This reference is a design note, not an implemented exporter. It records how the
Planning Forge machine-readable metamodel (`shared/metamodel.md`) would map to
two interchange standards so a future exporter has a stable target. Nothing here
changes validation or authoring today; JSON/YAML remains the source of truth and
Markdown/Mermaid/matrix views remain derived projections.

## Why record this now

The metamodel already separates nodes, typed edges, and provenance. Both ReqIF
and OSLC are graph-of-typed-resources models, so the mapping is mostly
mechanical. Writing it down now prevents a future exporter from inventing an
ad-hoc shape that drifts from the canonical model.

## Conceptual alignment

| Planning Forge | ReqIF | OSLC (RM/QM/AM) |
| --- | --- | --- |
| node | `SPEC-OBJECT` | `oslc_rm:Requirement` / `oslc_qm:TestCase` / resource |
| node `id` | `SPEC-OBJECT/@IDENTIFIER` | `dcterms:identifier` |
| node `type` | `SPEC-OBJECT-TYPE` | `rdf:type` |
| node `title` | attribute `ReqIF.Name` | `dcterms:title` |
| node `statement` | attribute `ReqIF.Text` | `oslc_rm:requirementText` / `dcterms:description` |
| node `status` | enumeration attribute | `oslc:status` (or custom property) |
| edge | `SPEC-RELATION` | `oslc:Link` (typed) |
| edge `relationship` | `SPEC-RELATION-TYPE` | link predicate (e.g. `oslc_rm:validatedBy`) |
| `id_namespace` | tool extension / prefix | resource namespace prefix |
| provenance (`source`, `evidence`, `confidence`) | custom attributes | `dcterms:source`, `prov:*`, custom |
| `impact_if_false` | custom attribute | custom property / `oslc:Link` to impacted resources |

## Node type mapping

| Planning Forge `type` | ReqIF object type | OSLC resource type |
| --- | --- | --- |
| `user_story` | Requirement (Stakeholder) | `oslc_rm:Requirement` |
| `business_rule` | Requirement (Rule) | `oslc_rm:Requirement` |
| `functional_requirement` | Requirement (Functional) | `oslc_rm:Requirement` |
| `quality_requirement` | Requirement (Quality) | `oslc_rm:Requirement` |
| `interface` / `data_shape` | Requirement (Interface) | `oslc_rm:Requirement` |
| `acceptance_criterion` | Requirement (Acceptance) | `oslc_rm:Requirement` |
| `edge_case` | Requirement (Edge) | `oslc_rm:Requirement` |
| `assumption` | Requirement (Assumption) | `oslc_rm:Requirement` |
| `architecture_decision` | Requirement (Decision) | `oslc_am:Resource` |
| `test_case` | Requirement (Test) or QM object | `oslc_qm:TestCase` |

ReqIF has no first-class test type; exporters typically model test cases as a
distinct `SPEC-OBJECT-TYPE`. OSLC has a dedicated QM domain, so `test_case` maps
to `oslc_qm:TestCase` and `verified_by` edges become `oslc_rm:validatedBy` /
`oslc_qm:validatesRequirement` links.

## Relationship mapping

| Planning Forge `relationship` | ReqIF relation type | OSLC link predicate |
| --- | --- | --- |
| `derives_from` | `derives` | `oslc_rm:elaboratedBy` (reverse) |
| `satisfies` | `satisfies` | `oslc_rm:satisfies` |
| `refines` | `refines` | `oslc_rm:decomposedBy` (reverse) |
| `constrains` | `constrains` | custom `pf:constrains` |
| `conflicts_with` | `conflicts` | custom `pf:conflictsWith` |
| `depends_on` | `dependsOn` | custom `pf:dependsOn` |
| `supersedes` | `supersedes` | `dcterms:replaces` |
| `realized_by` | `isRealizedBy` | `oslc_am:elaboratedBy` |
| `demonstrated_by` | `isDemonstratedBy` | custom `pf:demonstratedBy` |
| `verified_by` | `isVerifiedBy` | `oslc_rm:validatedBy` |
| `mitigates` | `mitigates` | custom `pf:mitigates` |

Canonical edge direction is preserved on export. Reverse navigation
(e.g. "which requirements does this test validate?") is derived by traversing
edges in the opposite direction, exactly as the metamodel already requires;
exporters must not materialize duplicate reverse links.

## Provenance mapping

The provenance fields align with the W3C PROV concepts the metamodel already
references:

- `source` → `prov:wasDerivedFrom` / `dcterms:source`.
- `evidence[]` → `prov:wasInfluencedBy` links or attachment references; a
  `kind: "node"` evidence ref becomes an intra-document link.
- `confidence` → a custom attribute (no standard ReqIF/OSLC field exists).
- `claim_kind` → an additional classification attribute distinct from `type`.

Full PROV-O is intentionally out of scope; only the entity/derivation/evidence
distinction is carried across.

## Open questions for a future exporter

- Round-trip fidelity: import is harder than export; decide whether the exporter
  is one-way (publish) or must re-import without loss.
- Enumerations: ReqIF requires pre-declared `DATATYPE-DEFINITION` enums for
  `status`, `claim_kind`, `obligation`, and `confidence`.
- Tool extension namespace: pick a stable `pf:` namespace IRI before emitting
  custom predicates, so external tools can ignore or map them deterministically.
- Validation parity: an exported artifact should re-validate against
  `shared/schemas/planning-artifact.schema.json` after any round-trip.
