# planning-forge

Planning Forge is a planning workflow plugin for turning rough ideas, feature requests, technical goals, and review findings into implementation-ready planning artifacts before code is written.

It provides a small chain of focused agents for specification, architecture, test planning, prototype validation, and document publishing. The agents are designed to preserve scope boundaries, make assumptions explicit, keep acceptance criteria traceable, and hand downstream builders concrete contracts instead of vague intent.

## What ships

- `agents/planning-forge-coordinator.agent.md` — Planning Forge Coordinator for iterative, human-in-the-loop sessions: intent classification, readiness gating, stable-ID custody, and routing to the specialist agents or manual handoff prompts. Does not implement code, publish, or auto-advance stages.
- `agents/task-spec-agent.agent.md` — Specification Planner for requirements, acceptance criteria, readiness assessment, and task splitting.
- `agents/architecture-planner.agent.md` — Architecture Planner for design decisions, contracts, interfaces, data flow, failure modes, risks, rollout notes, and verification seams.
- `agents/test-planner.agent.md` — Test Planner for builder-ready test cases, fixtures, assertions, verification commands, and coverage gaps.
- `agents/prototype-spike.agent.md` — Prototype Spike for small throwaway validation artifacts that answer one concrete design, dependency, state-model, protocol, or UI question.
- `agents/planning-document-publisher.agent.md` — internal helper for persisting completed Planning Forge artifacts into repository documentation without changing their substance.
- `shared/` — local references for hardening, interactive clarification, discovery checks, prototype guidance, decision panels, and final planning self-review.

## Workflow

Use the agents independently, as a staged planning flow, or through the **Planning Forge Coordinator** for an iterative session. The Coordinator does not run the flow automatically: it classifies each request, enforces readiness gates, preserves stable IDs, and routes to the appropriate agent below (or emits a manual handoff prompt) only when the user explicitly asks to move forward.

1. **Specification Planner** clarifies the task, writes requirements and acceptance criteria, determines readiness, and splits work when useful.
2. **Architecture Planner** turns a ready or partial specification into implementation-facing design decisions and contracts.
3. **Test Planner** converts the specification and architecture into concrete tests and verification coverage.
4. **Prototype Spike** validates uncertainty when prose is not enough, then records the evidence-backed decision and cleanup path.
5. **Planning Document Publisher** saves completed artifacts only when explicitly requested by the workflow.

The workflow is intentionally conservative: missing requirements become open questions, consequential scope changes become explicit amendments, and advisory material stays evidence rather than instruction.

## Shared references

The shared references are not standalone skills. They are read by the agents only when relevant:

- `shared/readiness-model.md` — shared `ready`/`partial`/`blocked`/`unknown` model and ready-slice rules used by the spec, architecture, test, and coordinator agents.
- `shared/stable-id-discipline.md` — shared stable-ID taxonomy, preservation, supersession, and ID-change-summary rules.
- `shared/coordinator-routing.md` — Coordinator intent taxonomy, routing map, and per-intent handoff templates.
- `shared/subagent-invocation.md` — optional advanced mode: how the Coordinator invokes a specialist directly, relays the result, and falls back to a manual handoff prompt.
- `shared/session-state.md` — the Coordinator's resumable planning-session state shape, reconstructed without persistence.
- `shared/interactive-clarification.md` — one-question-at-a-time clarification protocol.
- `shared/spec-discovery.md` — live scope checks, candidate re-reading, and acceptance-criteria feasibility checks.
- `shared/spec-self-review.md` — brainstorming, oversized-scope decomposition, and meaningful alternatives checks.
- `shared/implementation-contract-hardening.md` — contract hardening for types, defaults, validation, errors, state, security, observability, and builder handoff details.
- `shared/decision-panel.md` — lightweight multi-perspective review for high-impact architecture tradeoffs.
- `shared/prototype-spike.md` — branch-specific prototype guidance for logic/state, dependency compatibility, and UI variation spikes.
- `shared/planning-self-review.md` — final adversarial self-review checks for planning artifacts.

## Examples

`examples/` holds manual-review fixtures for the Planning Forge Coordinator. Each folder pairs an input message (and any supplied artifact) with an `expected-coordinator-response.md` describing the required intent classification, gate decision, routing target, and handoff constraints. They are review anchors, not executable tests; see `examples/README.md`.

## Persistence

Planning Forge agents produce their planning output first. When the user explicitly asks to save, write, publish, or persist an artifact, the originating agent invokes the internal Planning Document Publisher. The publisher preserves IDs, avoids unrelated overwrites, redacts or blocks sensitive content, and stays within the requested documentation area.

## Scope

- Planning and validation guidance only.
- No automatic implementation.
- No commits, branches, pushes, pull requests, or issue publishing.
- No raw secrets, credentials, production identifiers, customer data, or PII.
- No global skill namespace pollution from shared references.