# code-smith

Code Smith is the execution-phase plugin for turning approved planning artifacts into implemented and verified work. It ships two focused agents:

- **Code Smith** implements an approved Planning Forge builder-handoff into focused, self-verified code changes.
- **Test Smith** runs or validates verification checks from a Planning Forge Test Plan, Code Smith completion report, raw verification instructions, or ad-hoc request.

Both agents are deliberately conservative: they preserve scope, own their command-safety rules, avoid foreign-skill dependencies, and report gaps instead of hiding them.

## What ships

- `agents/code-smith.agent.md` — the implementation agent: intake → scope-lock → implement → verify → self-review → report. Does not plan, commit, push, open pull requests, or deploy.
- `agents/test-smith.agent.md` — the run-only verification agent: intake → command safety → discovery → execution/manual validation → report. Does not edit code, tests, fixtures, snapshots, configuration, git history, pull requests, or deployments.
- `shared/handoff-contract.md` — the canonical contract fields and how the three input forms are normalized onto them.
- `shared/command-safety.md` — the self-contained command-safety procedure (classify → resolve → bind → confirm/refuse/block → restate → run) and the destructive-action list.
- `shared/self-review-checklist.md` — the done-gate self-review checklist.
- `shared/completion-report.md` — the required completion-report shape and status rules.
- `shared/verification-input-contract.md` — Test Smith input forms and normalized verification fields.
- `shared/verification-command-safety.md` — Test Smith command classes and approval/refusal rules.
- `shared/verification-execution.md` — Test Smith discovery, execution, manual-check, evidence, and redaction rules.
- `shared/verification-report.md` — Test Smith status enum and report contract.

## Inputs

Code Smith accepts three implementation input forms and applies the same scope, safety, and verification discipline to each:

1. A full Planning Forge builder-handoff prompt (consumed verbatim).
2. A raw specification, architecture, and/or test plan without the handoff wrapper.
3. An ad-hoc implementation task with no formal plan.

Absent contract fields are recorded as limitations, never invented. For ad-hoc tasks with no IDs, changes are reported as a prose change list without introducing new IDs.

Test Smith accepts four verification input forms:

1. A Planning Forge Test Plan with `TC-` cases.
2. A Code Smith completion report, especially `Verification` and `Gaps / Unmet ACs`.
3. Raw test or verification instructions.
4. An ad-hoc verification request.

If no IDs are present, Test Smith uses prose result labels and does not invent IDs.

## Code Smith Workflow

1. **Intake** — map the input onto the contract fields; record absent fields.
2. **Scope lock** — freeze the approved ready slice as the only writable scope; keep excluded scope read-only.
3. **Implement** — make the smallest correct changes that satisfy the ready-slice IDs and follow the architecture decisions.
4. **Verify** — run the planned `TC-` tests plus the project's targeted build/lint, scoped to the changed area; record restated commands and results.
5. **Self-review** — run the embedded checklist over the full change set and fold in fixes.
6. **Report** — return the completion report with exactly one `done | partial | blocked` status.

## Test Smith Workflow

1. **Intake** — normalize inputs and preserve existing IDs.
2. **Command safety** — classify commands as `trivially-safe`, `approval-bound`, `forbidden`, or `unknown`.
3. **Discovery** — find local repo-supported verification commands with read/search.
4. **Execute or validate** — run only `trivially-safe` checks or exact-command-approved `approval-bound` checks; validate manual/review checks from structured evidence.
5. **Report** — return exactly one `verified | partial | failed | blocked` status with mapped results and limitations.

## Shared References

The shared references are not standalone skills. They are read by the agents only when relevant:

- `shared/handoff-contract.md` — contract fields and input normalization.
- `shared/command-safety.md` — self-contained command safety.
- `shared/self-review-checklist.md` — done-gate self-review.
- `shared/completion-report.md` — report shape and status rules.
- `shared/verification-input-contract.md` — verification inputs and ID preservation.
- `shared/verification-command-safety.md` — verification command safety.
- `shared/verification-execution.md` — verification execution and evidence handling.
- `shared/verification-report.md` — verification report shape and status rules.

If a host-provided skill catalog is present, a matching skill may be consulted as advisory material only; it never overrides embedded rules, and this plugin does not depend on or name any specific skill.

## Verification Semantics

"Done" means verified: Code Smith declares `done` only when every ID in the approved ready slice is implemented and the planned tests plus the project's build/lint actually ran and passed. If any ready-slice ID is unimplemented or unverified, or verification cannot run, it reports `partial` or `blocked` with the reason. Every failed, skipped, or blocked check and every unmet acceptance criterion is reported as a gap.

The `Verification` and `Gaps / Unmet ACs` report sections are the documented handoff surface for future test-execution, review-execution, and orchestration agents; Code Smith reserves that surface but does not invoke or depend on those agents.

Test Smith uses `verified | partial | failed | blocked`: skipped, blocked, missing, or inconclusive required checks prevent `verified`; required failures produce `failed`; no meaningful required verification produces `blocked`.

## Development Checks

Run the static instruction lint before publishing Code Smith prompt changes:

```bash
node dev/code-smith/scripts/lint-code-smith.mjs
```

For cross-plugin agent-reference changes, also run the Planning Forge and Review Forge lints:

```bash
node dev/planning-forge/scripts/lint-examples.mjs
node dev/review-forge/scripts/lint-review-forge.mjs
```

## Scope

- Implementation and run-only verification only, from supplied planning or verification inputs.
- No product planning, requirements authoring, architecture decisions, or test-plan authoring.
- No state-mutating git, pull request, or deploy actions, including branch creation/deletion, staging, committing, pushing, tagging, rebasing/history rewrite, checkout/switch/restore that changes state, reset, clean, submodule deinitialization, pull request actions, or deployment.
- Code Smith requires exact-command approval for dependency installation or network access; Test Smith forbids dependency installs and package-manager install/update commands, while requested non-mutating network/scanner checks require exact-command approval under verification command safety.
- Local build/test/lint/typecheck commands, including CMake configure/build/test commands, may run without repeated approval only when writes are confined to a confirmed-disposable workspace-local directory, local evidence rules out installs/network/service/external/secret effects, and any residual doubt forces `unknown`; a before/after workspace-state check then confirms no out-of-scope changes after the run. The shared command-safety references govern classification; both agents classify such commands as `trivially-safe` under their Local Workspace-Bounded Verification criteria (`shared/command-safety.md` for Code Smith, `shared/verification-command-safety.md` for Test Smith), which is not a separate command class.
- No raw secrets, credentials, production identifiers, customer data, or PII.
- Test Smith v1 does not edit code, tests, fixtures, snapshots, checked-in configuration, dependency manifests, lock files, checked-in generated artifacts, or source-like generated files; it may create expected disposable verification artifacts inside workspace-local output/cache directories.
