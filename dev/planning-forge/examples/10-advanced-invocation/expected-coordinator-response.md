# Expected behavior

- Interpreted intent: `architecture-request`.
- Spec readiness is `ready`, and the user explicitly asked the Coordinator to run the
  specialist this turn.
- **Advanced mode**: if the `agent` tool is available, the Coordinator may invoke
  **Architecture Planner** directly with the same prompt it would have emitted manually
  (see `shared/subagent-invocation.md`).
- It invokes at most one specialist. After the specialist returns, it presents the
  output unedited, adds a compact Specialist Result Summary, refreshes the reported
  planning state, surfaces any ID change summary and carry-forward items, recommends
  the next action, and **stops** — it does not auto-advance to test planning or
  implementation.
- **Fallback**: if the `agent` tool is unavailable or invocation fails, it emits the
  manual Architecture Planner handoff prompt instead and says invocation was
  unavailable. The prompt content is identical to the invoked prompt.

## Representative response (advanced mode available)

````
## Planning Status

Current stage: architecture
Interpreted intent: architecture-request
Readiness: spec ready

## Recommended Next Action

Invoking Architecture Planner now (you asked to proceed). I will relay its output and
stop for your review before any further stage.

## Handoff Prompt (sent to Architecture Planner)

```text
Create an architecture plan from the approved task specification.

Task specification:
<specification.md>

Instructions:
- Do not change product scope. Do not add requirements. Do not implement code.
- Design the minimal architecture sufficient for the specification.
- Trace decisions to FR/NFR/AC/INT/EDGE IDs.
- Identify risks, trade-offs, implementation seams, and test seams.
```
````

After the Architecture Planner returns, the Coordinator relays the result, then adds a
Coordinator-owned summary like:

```markdown
## Specialist Result Summary
Stage completed: architecture
Artifact readiness: ready, partial, blocked, missing, or unknown based on the returned Design Contract Status
Stable ID changes: None reported, or the returned ID change summary
Carry-forward items: Scope amendments, open questions, coverage gaps, cleanup or absorb requirements, redactions, skipped writes, failed saves, invocation failures, or None
Also include any coverage gaps, prototype cleanup/absorb requirements, publishing redactions or skipped writes, failed saves, and invocation failures until resolved, deferred, or explicitly accepted.
Next recommended action: Review the architecture, request amendments, ask for test planning, publish, or request implementation handoff
```

Then it waits.

## Pass criteria

- Intent is `architecture-request`; gate (spec `ready`) passes.
- At most one specialist invoked; no auto-advance to the next stage.
- Invoked prompt content equals the manual fallback prompt.
- Specialist result summary is present after a successful invocation and includes carry-forward items.
- On unavailable `agent` tool or failure, falls back to the manual handoff prompt and records the invocation failure as a carry-forward item.
