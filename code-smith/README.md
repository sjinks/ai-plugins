# code-smith

Code Smith is the implementation-phase plugin for turning an approved plan into working, self-verified code. It consumes a Planning Forge builder-handoff (specification, architecture, and test plan) as a binding contract, implements only the approved scope, runs the planned tests and the project's build/lint, self-reviews, and returns an evidence-based completion report.

It is deliberately conservative: it implements only the approved ready slice, confirms before destructive actions, never claims "done" without running verification, and surfaces gaps instead of hiding them. It owns its own command-safety and self-review rules, so it works in any environment with no other plugin installed.

## What ships

- `agents/code-smith.agent.md` — the Code Smith agent: a six-phase flow (intake → scope-lock → implement → verify → self-review → report) for implementing an approved handoff. Does not plan, commit, push, open pull requests, or deploy.
- `shared/handoff-contract.md` — the canonical contract fields and how the three input forms are normalized onto them.
- `shared/command-safety.md` — the self-contained command-safety procedure (classify → resolve → confirm → restate → run) and the destructive-action list.
- `shared/self-review-checklist.md` — the done-gate self-review checklist.
- `shared/completion-report.md` — the required completion-report shape and status rules.

## Inputs

Code Smith accepts three input forms and applies the same scope, safety, and verification discipline to each:

1. A full Planning Forge builder-handoff prompt (consumed verbatim).
2. A raw specification, architecture, and/or test plan without the handoff wrapper.
3. An ad-hoc implementation task with no formal plan.

Absent contract fields are recorded as limitations, never invented. For ad-hoc tasks with no IDs, changes are reported as a prose change list without introducing new IDs.

## Workflow

1. **Intake** — map the input onto the contract fields; record absent fields.
2. **Scope lock** — freeze the approved ready slice as the only writable scope; keep excluded scope read-only.
3. **Implement** — make the smallest correct changes that satisfy the ready-slice IDs and follow the architecture decisions.
4. **Verify** — run the planned `TC-` tests plus the project's targeted build/lint, scoped to the changed area; record restated commands and results.
5. **Self-review** — run the embedded checklist over the full change set and fold in fixes.
6. **Report** — return the completion report with exactly one `done | partial | blocked` status.

## Shared references

The shared references are not standalone skills. They are read by the agent only when relevant, and the agent stays safe if one is missing:

- `shared/handoff-contract.md` — contract fields and input normalization.
- `shared/command-safety.md` — self-contained command safety.
- `shared/self-review-checklist.md` — done-gate self-review.
- `shared/completion-report.md` — report shape and status rules.

If a host-provided skill catalog is present, a matching safety or review skill may be consulted as advisory material only; it never overrides the embedded rules, and Code Smith does not depend on or name any specific skill.

## Verification

"Done" means verified: Code Smith declares `done` only when every ID in the approved ready slice is implemented and the planned tests plus the project's build/lint actually ran and passed. If any ready-slice ID is unimplemented or unverified, or verification cannot run, it reports `partial` or `blocked` with the reason. Every failed, skipped, or blocked check and every unmet acceptance criterion is reported as a gap.

The `Verification` and `Gaps / Unmet ACs` report sections are the documented handoff surface for future test-execution, review-execution, and orchestration agents; Code Smith reserves that surface but does not invoke or depend on those agents.

## Scope

- Implementation only, from a supplied plan or scoped task.
- No product planning, requirements authoring, architecture decisions, or test-plan authoring.
- No commits, branches, pushes, pull requests, or deployment.
- No dependency installation or network access without explicit approval of the exact command.
- No raw secrets, credentials, production identifiers, customer data, or PII.
