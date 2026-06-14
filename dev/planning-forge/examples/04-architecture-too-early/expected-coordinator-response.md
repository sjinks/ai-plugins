# Expected behavior

- Interpreted intent: `architecture-request`.
- Spec readiness is `blocked`, so the Coordinator **must not** route to Architecture
  Planner.
- It reports the blocking open questions and offers to either resolve them or proceed
  only if the user explicitly requests exploratory architecture.
- No handoff prompt to Architecture Planner is emitted in this turn.

## Representative response

```
## Planning Status

Current stage: spec
Interpreted intent: architecture-request
Spec readiness: blocked

## Recommended Next Action

Do not start architecture yet. The specification is blocked on core questions that
materially affect design. Resolve them first, or explicitly request exploratory
architecture if you accept the risk.

## Blocking Questions

- Who is allowed to perform a re-scan?
- Should processing be synchronous or asynchronous?
- What is the expected failure behavior when the scan source is unavailable?
```

## Pass criteria

- Intent is `architecture-request`.
- Does **not** route to Architecture Planner.
- Lists the blocking questions.
- Offers exploratory architecture only on explicit user request.
