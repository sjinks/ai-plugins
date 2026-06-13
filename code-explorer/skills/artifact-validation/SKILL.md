---
name: artifact-validation
description: "Use when: validating generated Code Explorer exploration artifacts before declaring an exploration complete: checking required markdown and machine-readable files exist, JSON parses and matches schemas, stable IDs are valid and unique, high/critical risks carry evidence, and limitations are documented. Final validation step of the Code Explorer workflow."
argument-hint: "Path to the docs/codebase-exploration directory to validate, and the repository root."
user-invocable: true
---

# Artifact Validation

Validate generated exploration artifacts before considering an exploration complete. This is the final gate of the Code Explorer workflow.

Follow the rules in the plugin's `shared/artifact-validation-rules.md` and `shared/stable-id-policy.md`. Both reference files live at the plugin root, sibling of `skills/`. When run standalone, those rules still apply; if either reference is unavailable, stop and report it.

## Do Not Skip This

Do not mark exploration as complete until artifact validation has passed or every remaining failure is documented as a limitation.

## Procedure

1. **Run the validator if a shell capability is available.** Per `shared/tooling-adapter.md`, use the environment's command-execution capability:
   ```bash
   node code-explorer/scripts/validate-artifacts.mjs docs/codebase-exploration --repo-root .
   ```
   Capture the report and exit code. If running scripts is not possible, perform the same checks by reading the artifacts directly (steps 2–8).
2. **Check required markdown files** (`00`–`13`) exist and are non-empty.
3. **Check required machine-readable files** exist under `machine-readable/` and parse as JSON.
4. **Check schemas**: each JSON artifact matches its schema in `shared/schemas/`. The most common failures are wrong enum casing (must be lowercase in JSON), missing `_meta`, and missing required fields.
5. **Check stable IDs**: every `id` uses a valid prefix and is unique within its artifact.
6. **Check evidence references**: `EVIDENCE-*` references resolve to records in `evidence_index.json` when present.
7. **Check risk quality**: every `high`/`critical` risk has evidence and a suggested verification.
8. **Check open questions**: unresolved items are recorded in `12_OPEN_QUESTIONS.md` / `open_questions.json` rather than guessed.

## Output

Produce a validation summary:

```markdown
## Artifact Validation Summary

- Validator: <ran | simulated by reading artifacts>
- Result: <pass | fail>

### Errors
- <error>, or "none"

### Warnings
- <warning>, or "none"

### Disposition
- <"Validation passed; exploration may be marked complete."
   | "Validation failed; the following must be fixed or documented as limitations before completion: ...">
```

## Rules

- Treat schema mismatches, missing required artifacts, missing `_meta`, invalid/duplicate IDs, and unevidenced high/critical risks as blocking errors.
- Treat unresolved file references, unknown evidence references, missing optional sections, and medium confidence as warnings.
- If a blocking error cannot be fixed (for example a file reference that is intentionally hypothetical), reclassify it explicitly under `## Limitations` in the affected artifact and say so in the disposition; do not silently pass.
- Never claim completion while a blocking error is unresolved and undocumented.
