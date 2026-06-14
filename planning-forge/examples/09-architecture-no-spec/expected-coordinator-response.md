# Expected behavior

- Interpreted intent: `architecture-request`.
- No specification exists yet (fresh session, no prior artifact).
- The missing-artifact precondition applies: the Coordinator must **not** route to
  Architecture Planner on empty inputs.
- It recommends creating a specification first (treat as `new-session`) and does not
  emit an architecture handoff prompt.

## Representative response

```
## Planning Status

Current stage: discovery
Interpreted intent: architecture-request
Readiness: unknown (no specification yet)

## Recommended Next Action

There is no specification to design from yet. Create one first, then return to
architecture. I can route this to Specification Planner as a new planning session.
```

## Pass criteria

- Intent is `architecture-request`.
- Does **not** route to Architecture Planner.
- Recommends creating a specification first.
- No empty-input handoff prompt.
