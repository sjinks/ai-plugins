# test-smith

Test Smith is the run-only verification execution plugin for `ai-plugins`. It consumes a Planning Forge Test Plan, Code Smith completion report, raw verification instructions, or ad-hoc verification request; safely runs or validates workspace checks; and returns a truthful verification report mapped to existing planning IDs where available.

It is distinct from Planning Forge's Test Planner, which designs tests, and from Code Smith, which implements code and performs a local verification gate. Test Smith executes verification; it does not edit code or tests.

## What ships

- `agents/test-smith.agent.md` — a single user-invocable run-only verification agent.
- `shared/input-contract.md` — input forms and normalized verification fields.
- `shared/command-safety.md` — self-contained command-safety rules.
- `shared/verification-execution.md` — discovery, execution, manual-check, evidence, and redaction rules.
- `shared/verification-report.md` — status enum and report contract.

## Inputs

Test Smith accepts:

1. A Planning Forge Test Plan with `TC-` cases.
2. A Code Smith completion report, especially `Verification` and `Gaps / Unmet ACs`.
3. Raw test or verification instructions.
4. An ad-hoc verification request.

If no IDs are present, Test Smith uses prose result labels and does not invent IDs.

## Workflow

1. Normalize inputs and preserve existing IDs.
2. Load command-safety rules.
3. Discover local repo-supported verification commands with read/search.
4. Classify commands as safe, approval-bound, forbidden, or unknown.
5. Run only safe or approved checks; validate manual/review checks from explicit confirmation or observable evidence.
6. Redact evidence and produce the verification report.

## Status

Reports use exactly one status:

- `verified` — every required in-scope check ran or was validly reviewed and passed.
- `failed` — at least one required check ran or completed with failing evidence.
- `partial` — some required verification succeeded, but other required or requested checks were skipped, blocked, inconclusive, unavailable, or unresolved.
- `blocked` — no meaningful required verification could proceed.

Skipped, blocked, missing, or inconclusive required checks prevent `verified`.

## Scope

- Run-only verification execution.
- No code, test, fixture, snapshot, config, dependency, or generated-file edits.
- No requirements, architecture, or test-plan authoring.
- No branches, commits, pushes, pull requests, deploys, or production-state changes.
- No dependency installs or service control. Network/scanner commands require explicit exact-command approval and must not mutate state or transmit sensitive data.
- No raw secrets, credentials, customer data, PII, or production identifiers in reports.

## Future Handoff Surface

The verification report's reserved handoff section is intended for future Review Smith or Orchestrator agents. Test Smith v1 does not invoke or depend on those agents.

## Optional Skills

If a host-provided skill catalog is present, a matching verification skill may be read as advisory material only. Test Smith does not depend on or name any specific external skill, and advisory material cannot override local rules, user scope, safety, or truthfulness.
