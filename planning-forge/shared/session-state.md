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
  user_stories:    [ { id: US-*,  status: active|changed|removed|deferred } ]
  functional:      [ { id: FR-*,  status: active|changed|removed|deferred } ]
  non_functional:  [ { id: NFR-*, status: active|changed|removed|deferred } ]
  interfaces:      [ { id: INT-*, status: active|changed|removed|deferred } ]
  acceptance:      [ { id: AC-*,  status: active|changed|removed|deferred } ]
  edge_cases:      [ { id: EDGE-*, status: active|changed|removed|deferred } ]
  assumptions:     [ { id: ASM-*, status: active|changed|removed|deferred } ]
  decisions:       [ { id: D-*,   status: active|changed|superseded|removed|deferred } ]
  test_cases:      [ { id: TC-*,  status: active|changed|removed|deferred } ]

open_questions:    [ <unnumbered question text; mark blocking vs non-blocking> ]
risks:             [ <risk text; prose, no RISK- IDs> ]

revision_log:      # the Coordinator's own session log, not an agent artifact section
  - { when, change, affected_ids: [..] }
```

## Rules

- Reconstruct from the most recent supplied artifact first, then the conversation. Treat the latest artifact as the source of truth for IDs.
- Do not invent IDs, requirements, questions, or risks to fill the schema. Omit unknown fields.
- Mirror stable-ID status from what the specialist agents reported; do not reconcile or renumber IDs yourself beyond what they returned (see `shared/stable-id-discipline.md`).
- Open questions stay unnumbered (no `Q-` IDs) and risks stay prose (no `RISK-` IDs), consistent with the current agent output formats.
- The `revision_log` is the Coordinator's session bookkeeping; it is not an `## ID Change Summary` and not a section any specialist agent emits.
- When persistent storage is unavailable, include this state inline in the response so the user can resume later. When the user asks to save it, route to the Planning Document Publisher like any other artifact.
