# Planning Forge Metamodel Fixtures

These fixtures exercise the machine-readable Planning Forge metamodel. They are intentionally small and validate schema shape, stable-ID/type consistency, typed traceability edges, and provenance.

| Fixture | Stage | Format |
| --- | --- | --- |
| `minimal-planning-bundle.json` | `planning_bundle` | JSON |
| `specification.json` | `specification` | JSON |
| `architecture.json` | `architecture` | JSON |
| `test-plan.yaml` | `test_plan` | YAML |

Run from the repository root:

```sh
# Validate (JSON or YAML)
node dev/planning-forge/scripts/validate-metamodel.mjs dev/planning-forge/fixtures/metamodel/minimal-planning-bundle.json
node dev/planning-forge/scripts/validate-metamodel.mjs dev/planning-forge/fixtures/metamodel/test-plan.yaml

# Generate human-readable views (Markdown summary, traceability matrix, Mermaid)
node dev/planning-forge/scripts/generate-metamodel-views.mjs dev/planning-forge/fixtures/metamodel/minimal-planning-bundle.json --view all

# Report traceability completeness (coverage gaps), stage-aware
node dev/planning-forge/scripts/metamodel-completeness.mjs dev/planning-forge/fixtures/metamodel/specification.json

# Export a one-way ReqIF 1.0 document (publish)
node dev/planning-forge/scripts/export-metamodel-reqif.mjs dev/planning-forge/fixtures/metamodel/minimal-planning-bundle.json --out bundle.reqif

# Export a one-way OSLC RDF/XML document (publish)
node dev/planning-forge/scripts/export-metamodel-oslc.mjs dev/planning-forge/fixtures/metamodel/minimal-planning-bundle.json --out bundle.rdf

# Regression tests
node dev/planning-forge/scripts/test-metamodel-validator.mjs
node dev/planning-forge/scripts/test-metamodel-views.mjs
node dev/planning-forge/scripts/test-metamodel-reqif.mjs
node dev/planning-forge/scripts/test-metamodel-oslc.mjs
```
