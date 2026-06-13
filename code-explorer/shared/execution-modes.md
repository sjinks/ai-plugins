# Execution Modes Reference

This reference defines the execution modes the Code Explorer orchestrator and skills support. It is a local reference, not an invocable skill.

## Modes

### `chat-only`

Report findings in chat only. Do not create or modify any files. Use this when the user has not approved writing artifacts.

### `write-docs`

May create or update `docs/codebase-exploration/`. Does not imply permission to run builds or tests.

### `write-docs-no-tests`

May create or update `docs/codebase-exploration/`, but must not run tests or build commands. Read-only inspection only.

### `write-docs-tests-approved`

May create or update `docs/codebase-exploration/` and may run safe, already-configured test and build commands (a single session approval covers the run).

### `refresh`

Update existing exploration artifacts in place. Preserve stable IDs per `shared/stable-id-policy.md` and human-added content per the protocol's refresh rules. Implies `write-docs`.

### `partial`

Explore only a requested path, component, feature, or concern (for example "run only security-sensitive-code-scan on src/api"). Produce or update only the artifacts that the requested scope affects, and record the limited scope under each artifact's `## Limitations` section.

### `validation`

Validate existing artifacts only (run the `artifact-validation` skill / `validate-artifacts.mjs`). Do not regenerate content.

## Default and Selection

- If no mode is provided, default to `chat-only`, or ask the user for permission before writing files.
- The mode maps to the JSON `_meta.mode` enum as follows: `chat-only`/`write-docs`/`write-docs-no-tests`/`write-docs-tests-approved` → `initial`; `refresh` → `refresh`; `partial` → `partial`; `validation` → `validation`.
- A write mode never overrides the protocol safety rules: still ask before first creating the output directory, never install dependencies, never modify files outside the output directory.
