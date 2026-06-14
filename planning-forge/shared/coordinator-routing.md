# Coordinator Routing Reference

This reference defines the intent taxonomy and per-intent handoff templates used by the Planning Forge Coordinator. It is a local reference, not an invocable skill.

Use it to classify a user message and to build the handoff prompt for the correct specialist agent. Agent names below are the exact `name:` values required for the `agents:` front-matter list and for `agent`-tool delegation. Do not paraphrase them.

- `Specification Planner`
- `Architecture Planner`
- `Test Planner`
- `Prototype Spike`
- `Planning Document Publisher`

## Intent Taxonomy

Classify each user message as exactly one of:

- `new-session` — a new feature, bug, project, or product idea with no reference to an existing planning artifact.
- `amend-spec` — adds or changes requirements, constraints, corrections, or scope clarifications for an existing spec.
- `answer-open-questions` — answers previously listed open questions.
- `readiness-check` — asks whether the plan is ready, complete, blocked, or safe to hand off.
- `architecture-request` — explicitly asks for architecture, design, technical plan, or decomposition.
- `test-plan-request` — explicitly asks for tests, QA plan, coverage, test matrix, fixtures, mocks, or validation strategy.
- `spike-request` — asks to validate, prototype, experiment, benchmark, inspect library behavior, or prove feasibility.
- `publish-request` — asks to save, write, publish, or place artifacts into files.
- `implementation-handoff-request` — explicitly asks to hand the plan to a builder or implementation agent, or for an implementation-ready prompt.
- `status-request` — asks where planning currently stands.
- `unclear` — cannot be safely classified.

When intent is `unclear`, ask one concise clarification question before heavy planning work, unless a safe default next action exists. For interactive clarification, follow `shared/interactive-clarification.md` (one consequential question per turn).

When a message carries more than one intent, classify the primary actionable intent, route it, and name the secondary intent in Recommended Next Action. Do not silently drop it.

## Routing Map

| Intent | Route to | Gate |
|--------|----------|------|
| `new-session` | Specification Planner | none |
| `amend-spec` | Specification Planner | none |
| `answer-open-questions` | Specification Planner | none |
| `readiness-check` | (no routing) report readiness | none |
| `architecture-request` | Architecture Planner | spec readiness gate |
| `test-plan-request` | Test Planner | spec exists |
| `spike-request` | Prototype Spike | specific uncertainty + decision criteria |
| `publish-request` | Planning Document Publisher | explicit save request |
| `implementation-handoff-request` | builder handoff prompt only | implementation gate |
| `status-request` | (no routing) report status | none |
| `unclear` | (no routing) ask one question | none |

The Coordinator never auto-advances stages. Routing happens only in response to the matching intent and, where a gate applies, only after the gate passes or the user explicitly overrides it.

Missing-artifact precondition: `architecture-request`, `test-plan-request`, `publish-request`, and `implementation-handoff-request` require the artifact(s) they consume to exist. If a required artifact is missing, do not route on empty inputs; recommend creating it first (treat as `new-session` for a missing spec). Likewise, if `amend-spec` or `answer-open-questions` arrives with no base specification, reclassify as `new-session` and confirm with the user.

## Handoff Templates

### `new-session` → Specification Planner

```
Create an initial task specification for the following request.

User request:
{{USER_REQUEST}}

Instructions:
- Treat this as a new planning session.
- Do not design architecture yet. Do not implement code.
- Identify user stories, functional requirements, non-functional requirements,
  interfaces/data shapes, acceptance criteria, edge cases, assumptions, and open
  questions.
- Mark readiness as ready, partial, or blocked.
- If information is missing, preserve it as Open Questions instead of inventing detail.
- Keep output implementation-ready where possible; do not over-specify unknowns.
```

### `amend-spec` → Specification Planner

```
Revise the existing task specification with the following amendment.

Amendment:
{{USER_AMENDMENT}}

Existing specification:
{{EXISTING_SPEC_REFERENCE_OR_CONTENT}}

Instructions:
- Preserve stable IDs. Do not renumber unchanged items.
- Update only affected sections where possible.
- Allocate new IDs only for new requirements, ACs, edge cases, or assumptions.
- Mark removed, deferred, or out-of-scope items explicitly.
- Update readiness status.
- Return changed sections, updated open questions, and an ID change summary.
- Do not redesign architecture. Do not implement code.
```

### `answer-open-questions` → Specification Planner

```
Resolve the following answered open questions in the existing specification.

User answers:
{{USER_ANSWERS}}

Existing specification:
{{EXISTING_SPEC_REFERENCE_OR_CONTENT}}

Instructions:
- Resolve only the questions the user answered.
- Move resolved information into the relevant requirements, ACs, assumptions, or
  out-of-scope sections.
- Keep unanswered questions visible. Do not infer answers to unanswered questions.
- Preserve stable IDs. Do not renumber unchanged items.
- Update readiness status.
- Return changed sections, remaining open questions, and an ID change summary.
```

### `architecture-request` → Architecture Planner (gated)

Check spec readiness first (see `shared/readiness-model.md`).

- `ready` → route with the template below.
- `partial` → do not route yet; present the three options below and wait for the user to choose.
- `blocked` → do not route unless the user explicitly requests exploratory design. When routing exploratory architecture, mark the handoff prompt's output as provisional, list the unresolved blocking questions as design assumptions, and forbid implementation handoff until they are resolved.
- no specification yet → do not route; recommend creating a specification first.

```
Create an architecture plan from the approved task specification.

Task specification:
{{SPEC_REFERENCE_OR_CONTENT}}

Instructions:
- Do not change product scope. Do not add requirements. Do not implement code.
- Design the minimal architecture sufficient for the specification.
- Avoid queues, distributed systems, caches, plugin architectures, or broad
  abstractions unless required by the specification.
- Trace decisions to FR/NFR/AC/INT/EDGE IDs.
- Identify risks, trade-offs, implementation seams, and test seams.
```

Partial-spec options to present:

```
1. Continue refining the specification.
2. Create architecture only for the ready slice.
3. Explicitly drop or defer the blocked scope for this planning round.
```

For an approved ready-slice pass, add to the template:

```
Architect the approved ready slice only.
Ready scope: {{READY_SLICE_IDS}}
Excluded (blocked): {{BLOCKED_IDS_AND_QUESTIONS}}
Do not design excluded requirements. Identify assumptions introduced by limiting
architecture to the ready slice.
```

### `test-plan-request` → Test Planner

Require at least a specification. Prefer specification plus architecture.

With architecture:

```
Create a test plan from the task specification and architecture plan.

Inputs:
- Specification: {{SPEC_REFERENCE_OR_CONTENT}}
- Architecture:  {{ARCH_REFERENCE_OR_CONTENT}}

Instructions:
- Trace test cases to AC/FR/NFR/D/EDGE IDs.
- Identify unit, integration, E2E, regression, negative, and edge-case tests where
  applicable.
- Identify fixtures, mocks, fakes, and test data.
- Identify coverage gaps. Do not invent new requirements.
```

Without architecture:

```
Create a specification-level test plan from the task specification.

Specification:
{{SPEC_REFERENCE_OR_CONTENT}}

Instructions:
- Trace test cases to AC/FR/NFR/EDGE IDs.
- Mark architecture-dependent tests as coverage gaps.
- Do not invent architecture. Do not invent new requirements.
```

### `spike-request` → Prototype Spike (gated)

Route only when a specific uncertainty exists. If decision criteria are missing, ask for them or propose a minimal set before routing.

```
Run a throwaway prototype spike for the following uncertainty.

Uncertainty:
{{UNCERTAINTY}}

Relevant planning context:
{{SPEC_OR_ARCH_CONTEXT}}

Decision criteria:
{{DECISION_CRITERIA}}

Instructions:
- Keep the spike minimal and throwaway. Do not implement production code.
- Collect evidence. Return a verdict: supports, rejects, or inconclusive.
- Document durable findings and cleanup requirements.
- Identify which requirements, assumptions, risks, or decisions are affected.
```

### `publish-request` → Planning Document Publisher (gated)

Route only when the user explicitly asks to save or publish.

```
Publish the following Planning Forge artifacts.

Artifacts:
{{ARTIFACT_LIST}}

Target location:
{{TARGET_LOCATION_OR_DEFAULT_ai-docs}}

Instructions:
- Save or update only the requested artifacts.
- Preserve existing artifact names and paths where possible.
- Do not publish unrelated drafts. Do not implement code.
- Return a summary of written or updated files.
```

### `implementation-handoff-request` → builder handoff prompt (gated)

Run the gate check, then output a builder handoff prompt. Never output code, and never invoke an implementation agent automatically — the user passes the prompt onward.

Gate checks:

```
- Specification is ready, or a ready slice is explicitly approved.
- Architecture is ready, or the user explicitly accepts proceeding without it.
- A test plan exists, or the user explicitly accepts the test-plan gap.
- Known open questions are non-blocking or explicitly deferred.
- The user explicitly requested implementation handoff.
```

Handoff prompt:

```
Implementation Handoff

Use the following planning artifacts as the source of truth.

Specification: {{SPEC_REFERENCE_OR_CONTENT}}
Architecture:  {{ARCH_REFERENCE_OR_CONTENT_OR_ACCEPTED_GAP}}
Test Plan:     {{TEST_PLAN_REFERENCE_OR_CONTENT_OR_ACCEPTED_GAP}}

Instructions for the implementation agent:
- Implement only the approved scope. Do not add new product requirements.
- Preserve behavior outside the approved scope.
- Follow the architecture decisions unless blocked by repository reality; if repository
  reality conflicts with the plan, stop and report the conflict.
- Implement tests mapped to the provided test plan.
- Do not silently resolve open questions.
- Return a summary mapping code changes to FR/AC/D/TC IDs.
```

## Fallback Behavior

- Subagent invocation unavailable → emit the handoff prompt for the user to run.
- Repository search unavailable → ask the user for the relevant artifact or path.
- Interactive question tools unavailable → ask questions directly in the response.
- Persistent storage unavailable → include an explicit planning-state summary in the response.
