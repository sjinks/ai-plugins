# Readiness Model Reference

This reference defines the shared readiness model for Planning Forge agents. It is a local reference, not an invocable skill.

Use it whenever an agent assesses, reports, or gates on specification readiness. The Specification Planner sets readiness; the Architecture Planner, Test Planner, and Planning Forge Coordinator read and gate on it. All Planning Forge agents must use these definitions verbatim so readiness means the same thing across the workflow.

## Readiness Values

Use exactly one value.

- `ready`: downstream implementation can proceed for the full stated scope.
- `partial`: implementation can proceed for named portions, but other portions are blocked by unresolved questions or insufficient context.
- `blocked`: ambiguity or missing context prevents grounded functional requirements or acceptance criteria.
- `unknown`: readiness has not yet been assessed (for example, before any specification exists). Only the Coordinator uses `unknown`; the Specification Planner always resolves to `ready`, `partial`, or `blocked`.

Prefer `partial` over `blocked` when a conservative recommended MVP is implementable and remaining uncertainty affects only broader scope. Use `blocked` only when no grounded requirement set can be produced without a consequential answer.

## What `ready` Requires

A specification is `ready` when all of the following hold:

- Core user stories are defined.
- Functional requirements are clear.
- Implementation-relevant non-functional requirements are clear.
- Acceptance criteria are observable and testable.
- Major edge cases are identified.
- Blocking open questions are resolved.
- Assumptions are explicit.
- Out-of-scope items are explicit.
- Implementation tasks can be derived without guessing.

## What `partial` Requires

A specification is `partial` when:

- Some parts are ready and at least one part is blocked or unresolved.
- Implementation can proceed for a named subset only.

For `partial`, the assessing agent must name:

- the **ready slice**: the specific `US-`, `FR-`, `NFR-`, `INT-`, `AC-`, and `EDGE-` IDs that can proceed; and
- the **blocked items**: what cannot proceed and the specific open question(s) blocking each, cited by question text or a local label (open questions are unnumbered; see `shared/stable-id-discipline.md`).

## What `blocked` Means

A specification is `blocked` when:

- Core product behavior is unknown.
- Acceptance criteria cannot be written.
- Unresolved decisions materially affect architecture.
- Implementation would require guessing.

## Gating Rules

- Do not route a `blocked` specification to architecture unless the user explicitly requests exploratory architecture.
- For a `partial` specification, architecture may proceed only for the named ready slice, and only after the user explicitly chooses to do so.
- Do not advance a specification to architecture, test planning, publishing, or implementation handoff on readiness alone; an explicit user request is always required.

## ID Assignment By Readiness

- For `ready`, assign IDs to all in-scope user stories, FRs, NFRs, interfaces, ACs, assumptions, and edge cases.
- For `partial`, assign IDs to all implementation-ready items in the ready slice (user stories, FRs, NFRs, interfaces, ACs, assumptions, and edge cases). Keep blocked portions unnumbered in Open Questions.
- For `blocked`, do not assign IDs for ambiguous scope. Limit substantive content to confirmed scope, empty-state rationales, and blocking questions.
