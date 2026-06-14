# Specification: Planning Forge Coordinator

> Status: draft (readiness: partial). Tightened to match the actual `planning-forge`
> plugin conventions: real agent names, real front-matter shape, single-source shared
> docs, and a reconciled ID taxonomy. Open questions are tracked in §27.

## 1. Overview

Add a new `planning-forge` agent, **Planning Forge Coordinator**, that manages an
interactive, human-in-the-loop planning session across the plugin's existing
specialist agents:

- `Specification Planner` (`agents/task-spec-agent.agent.md`)
- `Architecture Planner` (`agents/architecture-planner.agent.md`)
- `Test Planner` (`agents/test-planner.agent.md`)
- `Prototype Spike` (`agents/prototype-spike.agent.md`)
- `Planning Document Publisher` (`agents/planning-document-publisher.agent.md`)

The Coordinator is **not** an automatic pipeline. Planning is iterative: a user may
start with a rough idea, refine it across many turns, answer open questions, revise
scope, and only later explicitly request architecture, test planning, a spike,
publishing, or implementation handoff.

The Coordinator acts as an interactive workflow navigator, readiness gatekeeper,
stable-ID custodian, planning-state tracker, handoff-prompt generator, and router to
the specialist agents. It does not implement product code.

> Naming note: throughout this spec, agent references use the exact `name:` value from
> each agent's front matter (e.g. `Specification Planner`, not "Task Specification
> Agent"; `Prototype Spike`, not "Prototype Spike Agent"). These exact names are
> required for the `agents:` front-matter list and `agent`-tool delegation to resolve.

---

## 2. Goals

### 2.1 Primary goals

1. Manage iterative planning sessions without forcing a linear waterfall.
2. Identify the current planning stage.
3. Classify the user's intent.
4. Preserve stable IDs across planning iterations.
5. Route work to the correct specialist agent.
6. Prevent premature transitions to architecture, test planning, publishing, or
   implementation handoff.
7. Distinguish ready scope from partial or blocked scope.
8. Generate precise handoff prompts for specialist agents.
9. Reconstruct planning state from existing artifacts and conversation context.
10. Work in both manual (handoff-prompt) and subagent-invocation runtimes.

### 2.2 Secondary goals

1. Make long-running planning conversations easier to resume.
2. Reduce accidental scope drift.
3. Reduce accidental requirement renumbering.
4. Reduce duplicated planning artifacts.
5. Improve traceability between specification, architecture, tests, spikes, and
   implementation handoff.
6. Keep the plugin portable across runtimes by falling back to manual handoff prompts
   when automatic subagent invocation is unavailable.

---

## 3. Non-goals

The Coordinator must not:

1. Automatically run all planning agents in sequence.
2. Automatically publish planning documents.
3. Automatically create branches, commits, PRs, or issues.
4. Hand off to implementation without explicit user approval.
5. Implement code or edit files.
6. Change product scope while routing to architecture or test planning.
7. Silently regenerate an existing specification from scratch.
8. Silently renumber requirements, acceptance criteria, decisions, or test cases.
9. Hide unresolved blocking questions.
10. Invent requirements to make a plan look complete.

---

## 4. Single source of truth for shared logic

The existing agents already define readiness statuses (`ready`/`partial`/`blocked`),
stable-ID handling, MVP defaulting, and amendment behavior — primarily in
`agents/task-spec-agent.agent.md`. The Coordinator must **not** re-specify that logic
inline, or it will drift from the agents.

Instead, extract the shared rules into new shared references that **both** the
Coordinator and the existing agents read:

- `shared/readiness-model.md` — the `ready`/`partial`/`blocked`/`unknown` model and
  ready-slice rules.
- `shared/stable-id-discipline.md` — ID preservation, allocation, removal/deferral,
  supersession, and ID-change-summary rules.
- `shared/coordinator-routing.md` — intent taxonomy and per-intent handoff templates.

Migration requirement: when these shared docs are introduced, update the relevant
existing agents to read them instead of restating the rules, so there is exactly one
canonical definition. The Coordinator and the specialist agents must agree.

The shared docs follow existing conventions (see `README.md` "Shared references"):
they are advisory references read only when relevant, not standalone skills, and must
not pollute a global skill namespace.

---

## 5. Existing agent contracts (as currently implemented)

These summaries reflect the agents as they exist today. The Coordinator must respect
them rather than assume new behavior.

### 5.1 `Specification Planner`

Converts rough ideas, amendments, answered questions, or review findings into an
implementation-ready specification. Emits user stories, FRs, NFRs, interfaces/data
shapes, edge cases, observable ACs, assumptions, open questions, optional
implementation tasks, and a readiness status (`ready`/`partial`/`blocked`). Already
owns ID-assignment rules and recommended-MVP defaulting. Can itself delegate to
`Architecture Planner` and `Planning Document Publisher`.

### 5.2 `Architecture Planner`

Turns a ready or partial specification into builder-ready design decisions. Must not
change product scope; requests a scope amendment instead. Can delegate to
`Prototype Spike`, `Test Planner`, and `Planning Document Publisher`.

### 5.3 `Test Planner`

Turns a specification (and architecture when available) into a traceable test plan and
records coverage gaps. Must not invent requirements or architecture.

### 5.4 `Prototype Spike`

Builds the smallest throwaway artifact answering one concrete uncertainty; the durable
output is the evidence-backed decision, not the code. This agent carries `edit` and
`execute` tools — the Coordinator does not.

### 5.5 `Planning Document Publisher`

Internal helper (`user-invocable: false`). Persists completed artifacts into the
requested docs directory, defaulting to `ai-docs` when saving was requested and no
directory was named. Preserves IDs, avoids unrelated overwrites, redacts/blocks
sensitive content. Must not be invoked except for completed artifacts.

---

## 6. Core concept

The Coordinator is a planning-session coordinator, not a pipeline. The expected loop:

```
rough idea
  -> spec draft
  -> user amendments
  -> spec revision
  -> user answers open questions
  -> readiness check
  -> explicit architecture request
  -> architecture handoff
  -> optional spike
  -> test planning
  -> publishing
  -> optional explicit implementation handoff
```

The user may repeat specification refinement many times before moving on. The
Coordinator must support that loop and never auto-advance.

---

## 7. Intent classification

For every user message, the Coordinator classifies intent as exactly one of:

```
new-session
amend-spec
answer-open-questions
readiness-check
architecture-request
test-plan-request
spike-request
publish-request
implementation-handoff-request
status-request
unclear
```

### 7.1 Classification rules

- `new-session` — a new feature, bug, project, or product idea with no reference to an
  existing planning artifact.
- `amend-spec` — adds/changes requirements, constraints, corrections, or scope
  clarifications to an existing spec.
- `answer-open-questions` — answers previously listed open questions.
- `readiness-check` — asks whether the plan is ready, complete, blocked, or safe to
  hand off.
- `architecture-request` — explicitly asks for architecture, design, technical plan,
  or decomposition.
- `test-plan-request` — explicitly asks for tests, QA plan, coverage, test matrix,
  fixtures, mocks, or validation strategy.
- `spike-request` — asks to validate, prototype, experiment, benchmark, inspect
  library behavior, or prove feasibility.
- `publish-request` — asks to save, write, publish, or place artifacts into files.
- `implementation-handoff-request` — explicitly asks to hand the plan to a builder or
  implementation agent, or for an implementation-ready prompt.
- `status-request` — asks where planning currently stands.
- `unclear` — cannot be safely classified.

When intent is `unclear`, do heavy planning work only after one concise clarification,
unless a safe default next action exists. Reuse `shared/interactive-clarification.md`
(one consequential question per turn) rather than re-describing clarification rules.

---

## 8. Planning session state (minimal MVP)

The MVP does not persist state. The Coordinator reconstructs state from artifacts and
conversation and reports only the fields it actually uses to route:

```
current_stage:   discovery | spec | architecture | test-plan | publish | implementation
intent:          <one of §7>
readiness:
  spec:          ready | partial | blocked | unknown
  architecture:  missing | ready | blocked | unknown
  tests:         missing | ready | blocked | unknown
artifacts:
  specification: <path-or-inline-or-missing>
  architecture:  <path-or-inline-or-missing>
  test_plan:     <path-or-inline-or-missing>
blocking_questions: [<question text or local labels>]
ready_slice:        [<US/FR/NFR/INT/AC/EDGE IDs>]   # when readiness is partial
```

The richer, fully-typed session schema (stable-ID tables per category, assumptions,
risks, spike reports, changelog, published-document tracking) is **Phase 4** and is
defined in §25. Introducing it earlier contradicts the MVP and adds avoidable
cognitive load.

---

## 9. Stable ID discipline

ID rules live in `shared/stable-id-discipline.md` (§4) and are summarized here.

### 9.1 ID taxonomy

Use only the prefixes the specialist agents actually emit. Verified against the current
agent output formats:

| Prefix | Item | Emitted by |
|--------|------|------------|
| `US-`  | user story | Specification Planner |
| `FR-`  | functional requirement | Specification Planner |
| `NFR-` | non-functional requirement | Specification Planner |
| `INT-` | interface / data shape | Specification Planner |
| `AC-`  | acceptance criterion | Specification Planner |
| `EDGE-`| edge case | Specification Planner |
| `ASM-` | assumption | Specification Planner |
| `D-`   | architecture decision | Architecture Planner |
| `TC-`  | test case | Test Planner |

Important corrections to the original draft:

- `INT-` is the **Interfaces And Data Shapes** prefix the Specification Planner already
  emits — it is not "integrations".
- Open questions are **unnumbered bullets** in the current agents; there is no `Q-`
  prefix. The Coordinator must reference open questions by quoting their text or by a
  locally assigned label, and must not instruct agents to emit `Q-` IDs. Examples in
  this spec that use `Q-3`/`Q-4` are illustrative shorthand for "a specific open
  question", not a required emitted ID. See OQ-1 (§27).
- `RISK-` (risk IDs) is **not** emitted by any current agent; risks stay as prose. See
  OQ-1 (§27).

The Coordinator must not instruct an agent to use a prefix it does not produce.
Adopting numbered open questions (`Q-`) or risks (`RISK-`) requires first updating the
owning agent's output format.

### 9.2 Rules

- Preserve existing IDs unless an item's meaning materially changes.
- Allocate new IDs from the next available number; never renumber existing items.
- On removal/deferral/out-of-scope: do not delete or reuse the ID; mark it
  removed/deferred/out-of-scope and record the change.
- On a material semantic change: keep the old ID only if downstream references stay
  valid; otherwise mark the old item superseded, allocate a new ID, and record the
  old→new mapping (e.g. `FR-3 superseded by FR-9`).

### 9.3 Spec-revision handoff prompts must include

```
Preserve stable IDs. Do not renumber unchanged items.
Allocate new IDs only for new items.
Mark removed or deferred items explicitly.
Return an ID change summary.
```

---

## 10. Readiness model

Defined in `shared/readiness-model.md` (§4); must match the Specification Planner's
existing definitions verbatim:

- `ready` — implementation can proceed for the full stated scope (clear user stories,
  FRs, implementation-relevant NFRs, testable ACs, identified major edge cases,
  resolved blocking questions, explicit assumptions and out-of-scope, derivable tasks).
- `partial` — implementation can proceed for named portions; others are blocked by
  unresolved questions or insufficient context. The Coordinator must name the ready
  slice and the blocked items, citing the specific blocking open questions by text or
  local label (open questions are unnumbered; see §9.1).
- `blocked` — no grounded FR/AC set can be produced without a consequential answer.
- `unknown` — not yet assessed.

Prefer `partial` over `blocked` when a conservative recommended MVP is implementable
and remaining uncertainty affects only broader scope (mirrors the Specification
Planner). Do not route a `blocked` spec to `Architecture Planner` unless the user
explicitly requests exploratory architecture.

---

## 11. Operating modes and routing

Each user-facing mode maps to one intent (§7) and one routing rule. Routing templates
are canonical in `shared/coordinator-routing.md`; representative templates appear below.

### 11.1 `new-session` → `Specification Planner`

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

### 11.2 `amend-spec` → `Specification Planner`

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

### 11.3 `answer-open-questions` → `Specification Planner`

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

### 11.4 `architecture-request` → `Architecture Planner` (gated)

Check spec readiness first.

- `ready` → route with the template below.
- `partial` → do not route yet; offer the three options below.
- `blocked` → do not route unless the user explicitly requests exploratory design.

```
Create an architecture plan from the approved task specification.

Task specification:
{{SPEC_REFERENCE_OR_CONTENT}}

Instructions:
- Do not change product scope. Do not add requirements. Do not implement code.
- Design the minimal architecture sufficient for the specification.
- Avoid queues, distributed systems, caches, plugin architectures, or broad
  abstractions unless required by the specification.
- Trace decisions to FR/NFR/AC/EDGE IDs.
- Identify risks, trade-offs, implementation seams, and test seams.
```

Partial-spec options the Coordinator must present:

```
1. Continue refining the specification.
2. Create architecture only for the ready slice.
3. Explicitly drop or defer the blocked scope for this planning round.
```

### 11.5 `test-plan-request` → `Test Planner`

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

### 11.6 `spike-request` → `Prototype Spike` (gated)

Route only when a specific uncertainty exists. If decision criteria are missing, ask
for them or propose a minimal set before routing.

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

### 11.7 `publish-request` → `Planning Document Publisher` (gated)

Route only when the user explicitly asks to save/publish.

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

### 11.8 `implementation-handoff-request` → builder handoff prompt (gated)

Run the gate check, then output a builder handoff prompt — never code, never an
automatic builder invocation. The Coordinator does not invoke the implementation agent;
the user does.

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

---

## 12. Coordinator output format

Default routing/coordination response:

```
## Planning Status

Current stage: ...
Interpreted intent: ...
Readiness: ...

## Recommended Next Action

...

## Blocking Questions

...

## Handoff Prompt

```text
...
```
```

Short interactions may be shortened but must always include: current stage,
interpreted intent, recommended next action, blocking questions (if any), and the
handoff prompt (when routing).

---

## 13. Manual router MVP (Phase 1 deliverable)

The first implementation is a manual router. It generates a precise handoff prompt for
the user to pass to the specialist agent; it does not invoke subagents.

### 13.1 MVP must

1. Classify user intent (§7).
2. Identify the current planning stage.
3. Recommend the next specialist agent.
4. Generate a handoff prompt.
5. Enforce readiness gates (§10).
6. Enforce stable-ID discipline (§9).
7. Avoid automatic stage transitions.

### 13.2 MVP must not (deferred)

1. Persist state to disk.
2. Invoke subagents automatically.
3. Read or write repository files for persistence.
4. Publish artifacts.
5. Execute commands.
6. Call the implementation agent.

The MVP `tools:` set is read-only routing only (`read`, `search`, `agent`,
`vscode/askQuestions`, and the `obsidian/search_vault*` tools used by the other
agents). It must not carry `edit` or `execute`.

---

## 14. Optional advanced mode (Phase 3)

When the runtime supports it, the Coordinator may invoke specialist agents directly via
the `agent` tool, using the same templates. Even then it must not auto-advance stages
without explicit user intent, and it must keep the manual handoff-prompt fallback.

---

## 15. Runtime compatibility and fallbacks

Preferred `tools:` (subject to runtime availability):

```
read, search, agent, vscode/askQuestions,
obsidian/search_vault_smart, obsidian/search_vault_simple, obsidian/search_vault
```

Whether to include `web` is OQ-2 (§27); the other agents carry it, but a pure router
may not need it.

Fallbacks:

- Subagent invocation unavailable → emit a handoff prompt instead of calling the agent.
- Repository search unavailable → ask the user for the relevant artifact or path.
- Interactive question tools unavailable → ask questions directly in the response.
- Persistent storage unavailable → include an explicit planning-state summary (§8).

---

## 16. Artifact lifecycle and paths

- **Draft** — may be incomplete and contain blocking questions; not handed to
  implementation unless the user explicitly accepts the risk.
- **Ready** — usable for downstream architecture, test planning, publishing, or
  implementation handoff.
- **Revised** — preserve IDs, update the changelog, summarize changed sections, avoid
  rewriting unrelated sections.
- **Published** — stable paths owned by `Planning Document Publisher`.

Path convention: defer to the publisher's existing default of `ai-docs` and to any
repository planning convention already in place. Do not introduce a competing
`planning/{slug}/...` tree. A suggested layout under the chosen docs root:

```
<docs-root>/<feature-slug>/
  specification.md
  architecture.md
  test-plan.md
  spikes/<spike-slug>.md
  handoff.md
```

This is recommended, not forced.

---

## 17. Changelog and ID-change summaries

Each meaningful revision should carry a changelog entry and, when IDs change, an ID
change summary:

```
## Changelog
### 2026-06-12
- Added read-only filesystem constraint.
- Added NFR-4, AC-9. Updated EDGE-3.
- Marked async processing as out of scope.

## ID Change Summary
- Added: NFR-4, AC-9
- Updated: EDGE-3
- Deferred: FR-6
- Superseded: FR-3 -> FR-9
- Removed: none
```

---

## 18. Readiness gate examples

Ready:

```
Spec readiness: ready
No blocking questions remain. Architecture may proceed.
```

Partial:

```
Spec readiness: partial
Ready slice: FR-1, FR-2, AC-1 through AC-5
Blocked: FR-3 depends on Q-4.
Recommended next action: resolve Q-4 before full architecture, or explicitly request
architecture for the ready slice only.
```

Blocked:

```
Spec readiness: blocked
Blocking questions:
- Q-1: Who is allowed to perform this action?
- Q-2: Should processing be synchronous or asynchronous?
- Q-3: What is the expected failure behavior?
Architecture should not proceed until these are resolved, unless the user explicitly
requests exploratory architecture.
```

---

## 19. Example interactions

### 19.1 New session

User: `I want to add vulnerability triage for WordPress plugins.`

```
## Planning Status
Current stage: discovery
Interpreted intent: new-session
Readiness: unknown

## Recommended Next Action
Create an initial task specification via Specification Planner.

## Handoff Prompt
```text
Create an initial task specification for vulnerability triage for WordPress plugins.
Instructions:
- Treat this as a new planning session. Do not design architecture. Do not implement.
- Identify user stories, FRs, NFRs, interfaces, ACs, edge cases, assumptions, and
  open questions. Mark readiness. Preserve unknowns as Open Questions.
```
```

### 19.2 Architecture requested too early (spec `partial`)

User: `Now let's do architecture.`

```
## Planning Status
Current stage: spec
Interpreted intent: architecture-request
Spec readiness: partial

## Recommended Next Action
Do not start full architecture yet. Architecture can proceed only for the ready slice.
Options:
1. Continue refining the specification.
2. Create architecture only for the ready slice.
3. Explicitly defer the blocked scope for this planning round.

## Blocking Questions
- Q-3: Failure behavior is not defined.
- Q-4: Authorization boundary is unclear.
```

### 19.3 Explicit ready-slice architecture

User: `Architect only the ready slice.`

```
## Planning Status
Current stage: architecture
Interpreted intent: architecture-request
Spec readiness: partial, ready-slice approved

## Recommended Next Action
Route to Architecture Planner for the approved ready slice only.

## Handoff Prompt
```text
Create an architecture plan for the approved ready slice only.
Ready scope: FR-1, FR-2, AC-1 through AC-5
Excluded (blocked): FR-3, pending Q-4
Instructions:
- Do not change product scope. Do not design excluded requirements.
- Trace decisions to FR/NFR/AC/EDGE IDs.
- Identify assumptions introduced by limiting architecture to the ready slice.
```
```

---

## 20. Example fixtures (not executable tests)

`planning-forge` has **no test harness** (unlike `code-explorer`). These are
illustrative fixtures stored under `examples/`, used for manual regression review of
Coordinator behavior, not automated golden tests. Building an executable harness for
agent-prompt behavior is out of scope for this spec (OQ-3, §27).

Each fixture documents: input message, available artifacts, expected intent, expected
routing target, and the key constraints the handoff prompt must contain.

| # | Input gist | Expected intent | Expected routing / behavior |
|---|-----------|-----------------|-----------------------------|
| 1 | "add plugin vulnerability triage" | `new-session` | route to Specification Planner; no architecture; initial spec prompt |
| 2 | "also support read-only filesystem" (spec has FR-1/FR-2/NFR-1/AC-1) | `amend-spec` | prompt requires ID preservation, no renumbering, ID change summary |
| 3 | "for Q2 only admins; Q3 async out of scope" | `answer-open-questions` | route to Specification Planner; resolve Q2/Q3; preserve unanswered |
| 4 | "let's do architecture" (spec `blocked`) | `architecture-request` | do not route; report blocking questions; offer refinement or explicit exploratory |
| 5 | "architect the ready slice only" (spec `partial`) | `architecture-request` | route to Architecture Planner; ready slice only; exclude blocked; require traceability |
| 6 | "create a test plan" (no architecture) | `test-plan-request` | route to Test Planner; spec-level plan; mark architecture-dependent gaps |
| 7 | "prototype this parser behavior" | `spike-request` | ask for / propose decision criteria; no broad implementation |
| 8 | "prepare this for the coding agent" | `implementation-handoff-request` | run gates; produce builder handoff prompt only if gates pass or gaps accepted |

---

## 21. Repository changes

New agent file:

```
planning-forge/agents/planning-forge-coordinator.agent.md
```

New shared references (single source of truth; §4):

```
planning-forge/shared/readiness-model.md
planning-forge/shared/stable-id-discipline.md
planning-forge/shared/coordinator-routing.md
```

Edits to existing files:

- `planning-forge/agents/task-spec-agent.agent.md` — read the new shared readiness and
  stable-ID docs instead of restating those rules inline.
- Other specialist agents — reference the shared readiness/ID docs where they currently
  restate the same rules.
- `planning-forge/README.md` — list the new Coordinator agent and the new shared docs.

Optional example fixtures (§20):

```
planning-forge/examples/01-new-session/...
planning-forge/examples/02-spec-amendment/...
planning-forge/examples/03-architecture-too-early/...
planning-forge/examples/04-ready-slice-architecture/...
planning-forge/examples/05-implementation-handoff/...
```

---

## 22. Agent front matter (repo-aligned)

Match the existing agents' shape: quoted strings, `agents:` routing list,
`argument-hint:`, and `user-invocable:`. Names in `agents:` must be the exact `name:`
values of the target agents.

```yaml
---
name: "Planning Forge Coordinator"
description: "Use when: managing an iterative, human-in-the-loop Planning Forge session. Classifies intent, tracks planning stage, enforces readiness gates, preserves stable IDs, and routes to specialist planning agents or emits handoff prompts. Does not implement code, publish, or auto-advance stages."
tools:
  - read
  - search
  - agent
  - vscode/askQuestions
  - obsidian/search_vault_smart
  - obsidian/search_vault_simple
  - obsidian/search_vault
agents:
  - Specification Planner
  - Architecture Planner
  - Test Planner
  - Prototype Spike
  - Planning Document Publisher
argument-hint: "Describe the planning idea, amendment, question, or stage you want to work on."
user-invocable: true
---
```

If some tools are unavailable in the target runtime, the Coordinator must still work by
producing manual handoff prompts (§15).

---

## 23. Agent prompt body (outline)

Keep the `.agent.md` body concise and consistent with sibling agents; do not duplicate
the full §7–§12 text. Recommended sections, each short and ordered for weaker models:

1. **Role** — one paragraph: iterative coordinator; no code; no auto-advance; emits
   handoff prompts or invokes specialists.
2. **Boundaries** — mirror sibling agents' boundary block (no implement/edit/branch/
   commit/push/publish; no scope change while routing; no sensitive data).
3. **Core rules** — iterative; never auto-advance; preserve IDs; prefer revision over
   regeneration; separate ready from blocked scope; treat open questions as
   first-class; do not hide uncertainty; fall back to handoff prompts.
4. **Intent classification** — list the §7 categories; point to
   `shared/coordinator-routing.md`.
5. **Routing** — one line per intent; point to `shared/coordinator-routing.md` for
   templates rather than inlining them.
6. **Readiness** — point to `shared/readiness-model.md`.
7. **Stable IDs** — point to `shared/stable-id-discipline.md`.
8. **Output format** — the §12 block.

---

## 24. Acceptance criteria

The implementation is complete when:

1. `planning-forge/agents/planning-forge-coordinator.agent.md` exists with repo-aligned
   front matter (§22), including a correct `agents:` list using exact agent names.
2. The agent states it is not an automatic pipeline.
3. It classifies intent into the §7 categories.
4. It generates handoff prompts targeting the correct specialist agent for each intent,
   using exact agent names.
5. It enforces explicit user approval before architecture, test planning, publishing,
   and implementation handoff.
6. It enforces stable-ID discipline in all spec-revision flows.
7. It distinguishes `ready`/`partial`/`blocked` and supports ready-slice architecture.
8. It supports manual routing when subagent invocation is unavailable.
9. Readiness and stable-ID rules live in shared docs read by both the Coordinator and
   the existing agents; no rule is defined in two places.
10. The ID taxonomy used in prompts matches what the specialist agents actually emit
    (§9.1); no agent is told to emit an unsupported prefix.
11. Example fixtures (§20) exist and demonstrate the eight behaviors.
12. `README.md` lists the new agent and shared docs.
13. It does not implement code, auto-publish, or auto-hand-off to implementation.
14. Fallback behavior for runtimes without subagent support is documented in the agent.

---

## 25. Implementation plan

### Phase 1 — MVP manual coordinator
- `planning-forge/agents/planning-forge-coordinator.agent.md` (front matter §22, body
  §23).
- `planning-forge/shared/readiness-model.md`, `shared/stable-id-discipline.md`,
  `shared/coordinator-routing.md`.
- Migrate the existing agents to read those shared docs (§4, §21).
- Update `README.md`.
- No persistence, no automatic subagent calls, no repository writes.

### Phase 2 — Example fixtures
- Add `planning-forge/examples/...` covering the eight §20 behaviors.

### Phase 3 — Optional subagent integration
- Allow the Coordinator to invoke specialists via `agent`; keep the manual fallback;
  never auto-advance without explicit user intent.

### Phase 4 — Artifact state support
- Introduce the full session-state schema (per-category stable-ID tables, assumptions,
  risks, spike reports, changelog, published-document tracking), path conventions, and
  ID-change-summary persistence.

---

## 26. Final design principle

The Coordinator makes Planning Forge feel like a guided planning session, not a rigid
pipeline. The user stays in control of stage transitions; the Coordinator makes the
workflow safer, more traceable, and easier to resume.

---

## 27. Open questions

- **OQ-1** — Should open questions (`Q-`) and risks (`RISK-`) become first-class
  numbered IDs? Today open questions are unnumbered bullets and risks are prose. This
  requires updating the Specification Planner / Test Planner output formats first. Until
  resolved, the Coordinator references open questions by text/local label and keeps
  risks as prose (§9.1).
- **OQ-2** — Should the Coordinator carry the `web` tool? Sibling agents do, but a pure
  router may not need it (§15, §22).
- **OQ-3** — Do we want an executable regression harness for agent-prompt behavior, or
  are manual example fixtures sufficient? `planning-forge` currently has none (§20).
- **OQ-4** — Where should published planning docs live by default — the publisher's
  `ai-docs` default or a repo-specific planning convention? (§16)
