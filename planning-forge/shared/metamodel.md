# Planning Forge Machine-Readable Metamodel

This reference defines the first Planning Forge machine-readable artifact model. It is a local reference, not an invocable skill.

Markdown remains the required human-facing planning format. For durable artifacts that need validation, export, reporting, or generated views, the machine-readable JSON artifact is the source of truth and Markdown is a readable projection of the same content.

## Source Of Truth

- JSON is the canonical validated format. YAML (`.yaml`/`.yml`) is accepted as an authoring convenience and is parsed into the same shape before validation; quote any value that must stay a string (for example `schema_version: "1.1"`).
- Validate artifacts against `shared/schemas/planning-artifact.schema.json`.
- Store traceability relationships in the top-level `edges` array. Do not duplicate relationships as reverse fields on nodes.
- Generate Markdown, traceability matrices, Mermaid diagrams, test-planning inputs, completeness reports, and future ReqIF/OSLC exports from the validated model.
- If Markdown and JSON disagree, treat the schema-valid JSON artifact as authoritative for IDs, node types, status, and traceability edges.

## Model Shape

The canonical model has two main collections:

- `nodes`: stable planning items such as user stories, business rules, requirements, acceptance criteria, architecture decisions, and test cases.
- `edges`: typed traceability relationships using the relationship vocabulary from `shared/traceability-graph.md`.

Use `id_namespace` to record the project-scoped namespace token from `shared/stable-id-discipline.md` when artifact IDs carry a concern prefix such as `SESSION-FR-1`. The namespace value is the uppercase token only, for example `SESSION`, and must match the prefix used by namespaced IDs in the artifact. Use `null` when the artifact uses bare IDs such as `FR-1`.

Keep node fields compact. Prefer `statement`, `rationale`, `owner`, `obligation`, `release_priority`, `status`, and `verification_method` over broad custom metadata. Add a schema field only when it supports validation, generation, or downstream planning.

## Provenance Rules

Separate facts, assumptions, decisions, and recommendations in machine-readable artifacts. Use `claim_kind` to classify the information claim alongside the planning node `type`; for example, an `ASM-` node has `type: "assumption"` and `claim_kind: "assumption"`, while a `D-` node may use `claim_kind: "decision"` for a chosen path or `claim_kind: "recommendation"` for a proposed path. The validator allows only claim kinds that make sense for each node type.

Use provenance fields whenever a node depends on user input, repository evidence, inference, advisory material, or a prior planning artifact:

- `source`: where the claim came from, such as `user-stated`, `inferred-from-repository`, `repository-evidence`, `external-reference`, `private-note`, `planner-inference`, `advisory-material`, or `derived-from-artifact`.
- `evidence`: concrete supporting references. Prefer file paths, stable node IDs, command labels, document names, or URLs over prose-only evidence.
- `confidence`: `low`, `medium`, or `high` confidence in the claim.
- `impact_if_false`: downstream IDs or short consequences that must be revisited if the claim is wrong.

When either `source` or `confidence` is present, both fields must be present. Assumption nodes must include `source`, `confidence`, and `impact_if_false`. Any node with `source` set to `inferred-from-repository`, `repository-evidence`, `external-reference`, `private-note`, `advisory-material`, or `derived-from-artifact` must also include at least one `evidence` item; `user-stated` and `planner-inference` may omit evidence when no concrete reference exists. This mirrors W3C PROV's useful distinction between what was produced, how it was produced, and what evidence or agent activity produced it, without requiring full PROV-O internally.

## Edge Rules

- Use the canonical edge direction: `<source> <relationship> <target>`.
- Use stable IDs as endpoints whenever possible.
- Use external labels only for concepts without stable IDs yet, such as `Goal`, `In Scope`, `risk: <title>`, `manual check: <label>`, `review check: <label>`, or `command: <label>`.
- Do not store reverse edges manually. Reverse traceability queries are derived by traversing `edges` in the opposite direction.

## Validation

Validate a Planning Forge machine-readable artifact from the repository root:

```sh
node dev/planning-forge/scripts/validate-metamodel.mjs <artifact.(json|yaml|yml)>
```

The validator checks JSON/YAML parsing, JSON Schema conformance, stable-ID shape, duplicate node IDs, node type/prefix consistency, allowed external edge labels, edge references to known stable nodes, namespace consistency, relationship compatibility, claim-kind compatibility, paired `source`/`confidence`, evidence requirements for evidence-backed sources, and required assumption provenance.

## Derived Views And Reports

Views are generated projections of the validated model; the JSON/YAML artifact stays the source of truth and views are never authored by hand.

```sh
# Markdown node summary + traceability matrix + Mermaid diagram
node dev/planning-forge/scripts/generate-metamodel-views.mjs <artifact> --view all

# Traceability completeness report (stage-aware coverage gaps)
node dev/planning-forge/scripts/metamodel-completeness.mjs <artifact> [--strict]
```

The completeness report is coverage-focused, not structural: run the validator first for well-formedness, then the completeness report to find missing `demonstrated_by`/`verified_by` coverage, unverified edge cases, unrealized decisions, and assumptions without `impact_if_false`. Coverage expectations are stage-aware — a `specification` is not expected to contain its own test cases, a `test_plan` is.

## Interchange Export

`shared/metamodel-export-mapping.md` records the planned mapping from the metamodel to ReqIF and OSLC. It is a design note for a future exporter, not an implemented feature; JSON/YAML remains authoritative.

## Minimal Example

```json
{
  "schema_version": "1.1",
  "artifact_type": "specification",
  "nodes": [
    {
      "id": "FR-1",
      "type": "functional_requirement",
      "claim_kind": "requirement",
      "title": "Revoke other sessions",
      "statement": "The authentication service MUST invalidate every session belonging to the account except the session authorizing the operation.",
      "obligation": "must",
      "release_priority": "must-have",
      "status": "approved"
    },
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "claim_kind": "verification",
      "title": "Other sessions are revoked",
      "statement": "Given an account owner has multiple active sessions, when they revoke all other sessions, then only the current session remains active.",
      "status": "approved"
    },
    {
      "id": "ASM-1",
      "type": "assumption",
      "claim_kind": "assumption",
      "title": "Sessions are centrally stored",
      "statement": "Existing sessions are stored centrally.",
      "status": "unconfirmed",
      "source": "inferred-from-repository",
      "evidence": [{ "kind": "file", "ref": "src/session/store.ts" }],
      "confidence": "medium",
      "impact_if_false": ["D-1 must be revisited"]
    }
  ],
  "edges": [
    { "source": "FR-1", "relationship": "demonstrated_by", "target": "AC-1" }
  ]
}
```