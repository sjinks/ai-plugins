# Expected behavior

- Interpreted intent: `status-request`.
- Does **not** route to any specialist.
- Reports the planning session state per `shared/session-state.md`, populating only
  fields with evidence (here: a partial spec, no architecture or test plan yet).
- Stable-ID status mirrors what the spec emitted; open questions stay unnumbered; no
  invented IDs, risks, or questions.
- Any unresolved specialist open items from the latest artifacts remain visible as
  carry-forward items until resolved.
- Because the user asked for a resumable summary, the Coordinator includes the fuller
  state inline (no persistence required).

## Representative response

````
## Planning Status

Current stage: spec
Interpreted intent: status-request
Readiness: spec partial, architecture missing, tests missing

## Session State

title: WordPress plugin vulnerability triage
artifacts:
  specification: { inline, readiness: partial }
  architecture:  { missing }
  test_plan:     { missing }
stable_ids:
  functional:     [ FR-1 active, FR-2 active ]
  non_functional: [ NFR-1 active ]
  interfaces:     [ INT-1 active ]
  acceptance:     [ AC-1 active, AC-2 active ]
  edge_cases:     [ EDGE-1 active ]
open_questions:
  - Which notification channel should fire for critical reports? (blocking the
    notification-on-critical scope; unnumbered)
ready_slice: [ FR-1, FR-2, NFR-1, INT-1, AC-1, AC-2, EDGE-1 ]
carry_forward:
  - source: spec open question (see open_questions); disposition: unresolved;
    handoff impact: blocks notification-on-critical scope until answered.

## Recommended Next Action

Resolve the notification-channel question to unblock the notification scope, or proceed
to architecture for the ready slice only. No stage advances without your go-ahead.
````

## Pass criteria

- Intent is `status-request`; no routing.
- Reports session state with only evidence-backed fields.
- Open questions unnumbered; no invented IDs/risks.
- Carry-forward items mirror unresolved specialist blockers or gaps already present in the supplied artifacts.
- Recommends a next action without auto-advancing.
