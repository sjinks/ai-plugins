# Expected behavior

- Interpreted intent: `architecture-request`.
- Spec readiness is `partial`, and the user has explicitly approved architecting the
  ready slice only.
- Routes to **Architecture Planner** (exact name), scoped to the ready slice.
- The handoff prompt must:
  - name the ready scope (US-1, US-2, FR-1, FR-2, NFR-1, INT-1, AC-1 through AC-5,
    EDGE-1);
  - exclude the blocked notification-on-critical scope (unnumbered, pending the
    notification-channel question);
  - forbid product-scope changes and designing excluded requirements;
  - require tracing decisions to FR/NFR/AC/INT/EDGE IDs;
  - ask for assumptions introduced by limiting architecture to the ready slice.

## Representative response

````
## Planning Status

Current stage: architecture
Interpreted intent: architecture-request
Spec readiness: partial, ready-slice approved

## Recommended Next Action

Route to Architecture Planner for the approved ready slice only.

## Handoff Prompt

```text
Create an architecture plan for the approved ready slice only.

Ready scope: US-1, US-2, FR-1, FR-2, NFR-1, INT-1, AC-1 through AC-5, EDGE-1
Excluded (blocked): notification-on-critical scope, pending the notification-channel
question (unnumbered; no ID assigned while blocked).

Instructions:
- Do not change product scope. Do not design excluded requirements. Do not implement.
- Design the minimal architecture sufficient for the ready slice.
- Trace decisions to FR/NFR/AC/INT/EDGE IDs.
- Identify assumptions introduced by limiting architecture to the ready slice.
```
````

## Pass criteria

- Intent is `architecture-request`.
- Routes to Architecture Planner.
- Scope limited to the ready slice; blocked notification scope excluded and unnumbered.
- Traceability to existing IDs required.
