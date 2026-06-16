# Completion Report Reference

This reference defines the report Code Smith returns at the end of every run. It is a local reference, not an invocable skill.

The report is the audit and handoff surface. Keep it factual, low-cardinality, and free of secrets: redact any secret or PII appearing in command or test output before including it. Reference existing IDs only; do not introduce a new ID prefix and do not number the change list.

## Required Sections

Return all sections in order. Write an empty section as `None — <reason>`.

```markdown
## Build Status
`done | partial | blocked` — <one-sentence rationale>

## Changes
- <file or change> → satisfies <US-/FR-/NFR-/INT-/AC-/EDGE-/D-/TC- as relevant>

## Verification
- Tests: <TC- IDs or test scope> — <passed | failed | skipped> (restated resolved command)
- Build/Lint: <passed | failed | skipped> (restated resolved command)
- Self-review: <checklist run; findings and how they were addressed or reported>

## Gaps / Unmet ACs
- <AC-/FR- id or check> — <why unmet, blocking question, or follow-up>

## Limitations
- <absent contract field, unavailable optional reference/skill, missing test runner, or None>

## Deferred
- Commit, branch, push, pull request, and deploy are out of Code Smith's scope.
```

## Status Rules

- Use exactly one Build Status.
- `done` only when every ID in the Approved ready slice is implemented and its planned verification ran and passed.
- If any ready-slice ID is unimplemented or unverified, or verification could not run (for example no test runner is available), the status is `partial` or `blocked` with the reason — never `done`.
- `partial` when some ready-slice scope is implemented and verified but other parts remain; name what remains.
- `blocked` when missing or conflicting information prevented meaningful implementation; name the blocking questions.

## Reserved Handoff Surface

The `Verification` and `Gaps / Unmet ACs` sections are the documented surface that future Test-execution, Review-execution, and Orchestrator agents will consume. Keep their shape stable; do not invoke or depend on those agents in this version.
