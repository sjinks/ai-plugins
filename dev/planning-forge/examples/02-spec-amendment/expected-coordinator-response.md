# Expected behavior

- Interpreted intent: `amend-spec`.
- Routes to **Specification Planner** (exact name) for a revision, not a regeneration.
- The handoff prompt **must** instruct the agent to:
  - preserve stable IDs (`US-1`, `FR-1`, `FR-2`, `NFR-1`, `INT-1`, `AC-1`, `EDGE-1`,
    `ASM-1`);
  - not renumber unchanged items;
  - allocate new IDs only for new items (e.g. a new `RULE-`, `NFR-`, `EDGE-`, or `ASM-` for the
    read-only filesystem constraint);
  - mark removed/deferred/out-of-scope items explicitly;
  - return an ID change summary.
- Does not redesign architecture or implement code.

## Representative response

````
## Planning Status

Current stage: spec
Interpreted intent: amend-spec
Readiness: partial

## Recommended Next Action

Revise the existing specification without regenerating it from scratch.

## Handoff Prompt

```text
Revise the existing task specification with the following amendment.

Amendment:
The service must work with a read-only filesystem.

Existing specification:
<existing-spec.md>

Instructions:
- Preserve stable IDs. Do not renumber unchanged items.
- Update only affected sections where possible.
- Allocate new IDs only for new items.
- Mark removed, deferred, or out-of-scope items explicitly.
- Update readiness status.
- Return the full updated specification in your standard output format (all sections in
  order), plus updated open questions and an ID change summary.
- Do not redesign architecture. Do not implement code.
```
````

## Pass criteria

- Intent is `amend-spec`.
- Target agent is Specification Planner.
- Prompt explicitly requires ID preservation, no renumbering, and an ID change summary.
- No regeneration from scratch; no architecture/implementation.
