# Planning Forge Coordinator Examples

These fixtures are manual-review regression anchors for the Planning Forge Coordinator (`agents/planning-forge-coordinator.agent.md`). They are **not executable golden tests** — `planning-forge` has no test harness. Use them to check, by hand, that a Coordinator response classifies intent correctly, applies the right readiness gate, preserves stable IDs, and routes to the correct specialist agent.

## How to use

For each example:

1. Read `input.md` (the user message) and any supplied artifact (`existing-spec.md`, `specification.md`, `architecture.md`, `test-plan.md`).
2. Run the Coordinator against that input.
3. Compare the response to `expected-coordinator-response.md`.

The expected responses describe the **required behavior and constraints**, not a byte-for-byte string match. A response passes if it:

- classifies the same intent,
- applies the same gate decision (route / hold / ask),
- targets the same specialist agent (by exact name) when routing,
- includes the same required handoff constraints (especially stable-ID instructions),
- does not auto-advance stages or invent requirements.

## Index

| # | Folder | Input gist | Expected intent | Expected behavior |
|---|--------|-----------|-----------------|-------------------|
| 1 | `01-new-session/` | "add plugin vulnerability triage" | `new-session` | route to Specification Planner; no architecture; initial spec prompt |
| 2 | `02-spec-amendment/` | "also support read-only filesystem" | `amend-spec` | route to Specification Planner; require ID preservation + ID change summary |
| 3 | `03-answer-open-questions/` | answers to two open questions | `answer-open-questions` | route to Specification Planner; resolve answered, keep unanswered |
| 4 | `04-architecture-too-early/` | "let's do architecture" (spec blocked) | `architecture-request` | do not route; report blocking questions; exploratory only on explicit request |
| 5 | `05-ready-slice-architecture/` | "architect the ready slice only" (spec partial) | `architecture-request` | route to Architecture Planner; ready slice only; exclude blocked; require traceability |
| 6 | `06-test-plan-without-architecture/` | "create a test plan" (no architecture) | `test-plan-request` | route to Test Planner; spec-level plan; mark architecture-dependent gaps |
| 7 | `07-spike-without-criteria/` | "prototype this parser behavior" | `spike-request` | ask for / propose decision criteria; no broad implementation |
| 8 | `08-implementation-handoff/` | "prepare this for the coding agent" | `implementation-handoff-request` | run gates; builder handoff prompt only if gates pass or gaps accepted |
| 9 | `09-architecture-no-spec/` | "let's do architecture" (no spec yet) | `architecture-request` | missing-artifact precondition: do not route; recommend creating a spec first |
| 10 | `10-advanced-invocation/` | "run the Architecture Planner for me now" (spec ready) | `architecture-request` | advanced mode: invoke one specialist, relay, stop; manual fallback if unavailable |
| 11 | `11-status-request/` | "where are we; give me a resumable summary" | `status-request` | no routing; report session state with evidence-backed fields only |
