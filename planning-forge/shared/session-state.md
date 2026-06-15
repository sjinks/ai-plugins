# Planning Session State Reference

This reference defines the planning-session state the Planning Forge Coordinator tracks across an iterative session. It is a local reference, not an invocable skill.

The Coordinator does not require persistent storage. It reconstructs state from the supplied artifacts and the conversation, and reports the state inline so the session can be resumed. This reference defines the full state shape; the Coordinator emits only the fields it has evidence for and omits the rest rather than inventing them.

This state is the Coordinator's own tracking surface. It is **not** a new agent output section: the specialist agents' output formats are unchanged, and the stable-ID prefixes remain exactly those in `shared/stable-id-discipline.md`.

## Minimal State (always available)

The Coordinator always reports at least the routing fields it uses:

```
current_stage:   discovery | spec | architecture | test-plan | publish | implementation
intent:          <one classified intent>
readiness:
  spec:          ready | partial | blocked | unknown
  architecture:  missing | ready | partial | blocked | unknown
  tests:         missing | ready | partial | blocked | unknown
artifacts:
  specification: <path | inline | missing>
  architecture:  <path | inline | missing>
  test_plan:     <path | inline | missing>
blocking_questions: [<question text or local label>]
ready_slice:        [<US/FR/NFR/INT/AC/EDGE IDs>]   # when readiness is partial
carry_forward:      [<specialist open item, blocker, coverage gap, cleanup need, redaction, save blocker, or invocation failure>]
```

## Full Session State (optional, resumable)

When the user wants a resumable summary, or a session has run long enough that reconstruction from scratch is error-prone, the Coordinator may emit the fuller state below. Populate only sections with evidence.

```
title:           <short session title>
current_stage:   discovery | spec | architecture | test-plan | publish | implementation

artifacts:
  specification: { path|inline|missing, readiness }
  architecture:  { path|inline|missing, readiness }
  test_plan:     { path|inline|missing, readiness }
  spikes:        [ { topic, verdict: supports|rejects|inconclusive, path|inline } ]
  published:     [ { path, artifact_type } ]

stable_ids:        # mirror what the specialist agents emitted; do not invent IDs
  # status: active | changed | superseded | removed | deferred | out-of-scope
  user_stories:    [ { id: US-*,   status } ]
  functional:      [ { id: FR-*,   status } ]
  non_functional:  [ { id: NFR-*,  status } ]
  interfaces:      [ { id: INT-*,  status } ]
  acceptance:      [ { id: AC-*,   status } ]
  edge_cases:      [ { id: EDGE-*, status } ]
  assumptions:     [ { id: ASM-*,  status } ]
  decisions:       [ { id: D-*,    status } ]
  test_cases:      [ { id: TC-*,   status } ]

open_questions:    [ <unnumbered question text; mark blocking vs non-blocking> ]
risks:             [ <risk text; prose, no RISK- IDs> ]
carry_forward:     [ <unresolved specialist item with source artifact/stage and whether it blocks next stage> ]

revision_log:      # the Coordinator's own session log, not an agent artifact section
  - { when, change, affected_ids: [..] }
```

## Rules

- Reconstruct from the most recent supplied artifacts first, then the conversation. Each artifact type is the source of truth for the IDs it defines, using the most recent version of that artifact type: the specification owns `US-`/`FR-`/`NFR-`/`INT-`/`AC-`/`EDGE-`/`ASM-`, the architecture owns `D-`, and the test plan owns `TC-`. Do not let a more recently supplied artifact of one type override IDs defined by another type.
- Do not invent IDs, requirements, questions, or risks to fill the schema. Omit unknown fields.
- Mirror stable-ID status from what the specialist agents reported; do not reconcile or renumber IDs yourself beyond what they returned (see `shared/stable-id-discipline.md`).
- Open questions stay unnumbered (no `Q-` IDs) and risks stay prose (no `RISK-` IDs), consistent with the current agent output formats.
- Carry-forward items come only from specialist output or failed invocations: unresolved Open Questions, Scope Amendments Requested, Coverage Gaps, prototype cleanup or absorb requirements, publishing redactions, skipped writes, failed saves, and invocation failures. Keep each item visible until a later artifact or user answer resolves it. If an item duplicates an open question or blocking question, keep one concise entry and preserve its source.
- The `revision_log` is the Coordinator's session bookkeeping; it is not an `## ID Change Summary` and not a section any specialist agent emits.
- When persistent storage is unavailable, include this state inline in the response so the user can resume later. When the user asks to save it, route to the Planning Document Publisher like any other artifact.
