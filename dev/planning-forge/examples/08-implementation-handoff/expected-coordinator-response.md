# Expected behavior

- Interpreted intent: `implementation-handoff-request`.
- All gates pass: spec `ready`, architecture `ready`, test plan present, no blocking
  open questions, and the user explicitly requested the handoff.
- The Coordinator produces a **builder handoff prompt only** — it does not implement
  code and does not invoke a builder automatically.
- The handoff prompt must:
  - point to the specification, architecture, and test plan as source of truth;
  - name the approved ready slice (`full scope` here) and excluded blocked scope
    (`None` here);
  - include accepted or deferred carry-forward items (`None` here);
  - restrict the builder to the approved scope and preserve out-of-scope behavior;
  - require following architecture decisions, stopping on repo-reality conflicts;
  - require implementing the mapped tests;
  - require a summary mapping code changes to FR/AC/D/TC IDs.

## Representative response

````
## Planning Status

Current stage: implementation
Interpreted intent: implementation-handoff-request
Readiness: spec ready, architecture ready, tests ready

## Recommended Next Action

All gates pass. Hand the plan to the implementation agent using the prompt below. The
Coordinator does not implement code; you run this prompt against your builder.

## Handoff Prompt

```text
Implementation Handoff

Use the following planning artifacts as the source of truth.

Specification: <specification.md>
Architecture:  <architecture.md>
Test Plan:     <test-plan.md>
Approved ready slice: full scope
Excluded blocked scope: None
Accepted carry-forward items: None

Instructions for the implementation agent:
- Implement only the approved scope. Do not add new product requirements.
- Preserve behavior outside the approved scope.
- Follow the architecture decisions unless blocked by repository reality; if repository
  reality conflicts with the plan, stop and report the conflict.
- Implement tests mapped to the provided test plan.
- Do not silently resolve open questions.
- Return a summary mapping code changes to FR/AC/D/TC IDs.
```
````

## Pass criteria

- Intent is `implementation-handoff-request`.
- Gate check is performed and passes.
- Output is a builder handoff prompt, not code, and no builder is auto-invoked.
- Prompt names the approved scope, excludes blocked scope, includes accepted carry-forward items, and requires FR/AC/D/TC traceability.
