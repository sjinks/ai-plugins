# Artifact Validation Rules Reference

This reference defines what "valid exploration artifacts" means. It is a local reference, not an invocable skill. The `artifact-validation` skill and `scripts/validate-artifacts.mjs` both implement these rules; keep them in sync.

## Validation Categories

### Structure

1. Every required markdown artifact (`00`–`13`) exists and is non-empty.
2. Every required machine-readable artifact exists under `machine-readable/`: `repository_index.json`, `entrypoints.json`, `dataflows.json`, `symbol_index.json`, `important_functions.json`, `dependency_graph.json`, `test_map.json`, `risks.json`.
3. Additive artifacts (`14`–`17` markdown and their JSON: `open_questions.json`, `evidence_index.json`, `contracts.json`, `config_surface.json`, `observability_map.json`, `security_sensitive_code.json`) are validated only when present; their absence is not an error.

### JSON well-formedness

4. Every JSON artifact parses.
5. Every JSON artifact has a `_meta` object with at least `schema` and `schemaVersion`.
6. Every JSON artifact matches its schema in `shared/schemas/`.

### IDs

7. Every `id` uses a valid prefix from `shared/stable-id-policy.md`.
8. IDs are unique within each artifact.

### Enums

9. `severity`, `confidence`, `riskCategory`, and other enum fields use only canonical lowercase values in JSON. Markdown may use capitalized display names; JSON may not.

### Risk quality

10. Every `high` or `critical` risk has a non-empty `evidence` array and a non-empty `suggestedVerification`.

### References

11. File references in markdown and JSON resolve to existing files relative to the repository root, where the repo root is available. Unresolvable references are warnings, not errors (the file may be intentionally hypothetical or outside scope).
12. Evidence references (`EVIDENCE-*`) resolve to records in `evidence_index.json` when that artifact is present. Unknown references are warnings.

### Content

13. Markdown artifacts are not empty.
14. Key markdown artifacts contain their required sections (for example, `01_REPOSITORY_MAP.md` has `## Languages`, `## Top-level directories`, and `## Limitations`).
15. Any JSON artifact whose `_meta.confidence` is `low` lists at least one entry in `_meta.limitations`.

## Errors vs Warnings

- **Errors** (exit code 1): missing required artifact, parse failure, schema mismatch, missing `_meta`/`schema`/`schemaVersion`, invalid or duplicate ID, high/critical risk without evidence or verification, empty required markdown.
- **Warnings** (exit code 0, or 1 under `--strict`): unverifiable file references, unknown evidence references, missing optional sections, medium-confidence risks, low confidence without limitations.

## Exit Codes

- `0` — valid (no errors; warnings allowed unless `--strict`).
- `1` — validation errors (or warnings under `--strict`).
- `2` — invalid usage or missing artifact directory.

## Running the Validator

```bash
node code-explorer/scripts/validate-artifacts.mjs docs/codebase-exploration
node code-explorer/scripts/validate-artifacts.mjs docs/codebase-exploration --strict --repo-root .
```
