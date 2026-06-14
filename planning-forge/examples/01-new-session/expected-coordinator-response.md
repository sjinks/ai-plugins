# Expected behavior

- Interpreted intent: `new-session`.
- No existing artifact referenced, so readiness is `unknown`.
- Routes to **Specification Planner** (exact name).
- Does **not** route to architecture, test planning, publishing, or implementation.
- Emits an initial-spec handoff prompt that asks for user stories, FRs, NFRs,
  interfaces/data shapes, ACs, edge cases, assumptions, and open questions, and that
  preserves unknowns as Open Questions instead of inventing detail.

## Representative response

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
- Treat this as a new planning session.
- Do not design architecture yet. Do not implement code.
- Identify user stories, functional requirements, non-functional requirements,
  interfaces/data shapes, acceptance criteria, edge cases, assumptions, and open
  questions.
- Mark readiness as ready, partial, or blocked.
- If information is missing, preserve it as Open Questions instead of inventing detail.
```
```

## Pass criteria

- Intent is `new-session`.
- Target agent is Specification Planner.
- No stage auto-advances.
- Prompt forbids architecture/implementation and preserves unknowns as Open Questions.
