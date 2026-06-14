# Stable ID Discipline Reference

This reference defines the shared stable-identifier rules for Planning Forge agents. It is a local reference, not an invocable skill.

Stable IDs make iterative planning safe: they let amendments, architecture, tests, and implementation handoffs reference the same items across many revisions. Use this reference whenever an agent creates, revises, removes, or hands off planning items. The Specification Planner, Architecture Planner, Test Planner, and Planning Forge Coordinator all rely on these rules.

## ID Taxonomy

Use only the prefixes the specialist agents actually emit:

| Prefix | Item | Emitted by |
|--------|------|------------|
| `US-`  | user story | Specification Planner |
| `FR-`  | functional requirement | Specification Planner |
| `NFR-` | non-functional requirement | Specification Planner |
| `INT-` | interface / data shape | Specification Planner |
| `AC-`  | acceptance criterion | Specification Planner |
| `EDGE-`| edge case | Specification Planner |
| `ASM-` | assumption | Specification Planner |
| `D-`   | architecture decision | Architecture Planner |
| `TC-`  | test case | Test Planner |

Notes:

- `INT-` is the Interfaces And Data Shapes prefix, not "integrations".
- Open questions are unnumbered bullets; there is no `Q-` prefix. Reference an open question by quoting its text or by a local label within a single response. Do not instruct any agent to emit `Q-` IDs.
- Risks are prose today; there is no `RISK-` prefix. Do not instruct any agent to emit risk IDs.
- Do not introduce a new prefix without first updating the owning agent's output format.

## Core Rules

### Preserve IDs

Preserve existing IDs unless the meaning of the item materially changes. Do not renumber unchanged items.

### Allocate new IDs

When new items are added, allocate the next available number for that prefix. Do not insert a new item by renumbering existing ones.

### Remove or defer without renumbering

When an item is removed, deferred, or declared out-of-scope:

- do not delete it silently;
- do not reuse its ID;
- mark it as removed, deferred, or out-of-scope;
- record the change in the ID change summary.

### Semantic changes

If an item's meaning changes materially:

- preserve the old ID only if downstream references remain valid;
- otherwise mark the old item as superseded, allocate a new ID, and record an old-to-new mapping.

Example: `FR-3 superseded by FR-9 — scope changed from local validation to remote policy enforcement.`

## ID Change Summary

Every revision that changes IDs must return an ID change summary:

```
## ID Change Summary
- Added: <ids or none>
- Updated: <ids or none>
- Deferred: <ids or none>
- Superseded: <old -> new, or none>
- Removed: <ids or none>
```

## Required Handoff Instructions

Every spec-revision handoff (amendment or open-question resolution) must instruct the receiving agent:

```
Preserve stable IDs. Do not renumber unchanged items.
Allocate new IDs only for new items.
Mark removed, deferred, or out-of-scope items explicitly.
Return an ID change summary.
```
