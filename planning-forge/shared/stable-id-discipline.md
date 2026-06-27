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

## Project-Scoped ID Namespaces

A single project may grow several specifications, architectures, or test plans (for example one per feature or concern). When more than one artifact of the same kind can coexist in a project, each `FR-1`/`AC-1`/`D-1` restarting at `1` makes cross-artifact references ambiguous and makes later consolidation lossy.

- When a new artifact joins a project that already has an artifact of the same kind, prepend a short concern token to the existing base prefix on every ID (for example `C-FR-1` for a client concern, `P-FR-1` for performance, `H-FR-1` for hardening) instead of restarting bare IDs at `1`. The concern token is a namespace prepended to a taxonomy prefix, not a new base prefix, so it does not require a taxonomy or output-format change; numbering still starts at `1` within each namespace (`<NS>-FR-1`, `<NS>-FR-2`).
- Keep the original artifact's unprefixed IDs unchanged; introducing namespaces is not a reason to renumber existing items.
- Choose a stable, uppercase concern token tied to the concern, not to the document filename, so the namespace survives a rename or merge. Use uppercase so namespaced IDs stay uniform with the existing uppercase prefixes and remain searchable and lintable.
- Record the chosen namespace once near the top of the artifact and in the ID change summary so downstream agents resolve references unambiguously.
- The first/only artifact of a kind in a project may keep the bare prefixes; add a namespace as soon as a second same-kind artifact appears.
- When consolidating sources that each already carry bare (unprefixed) IDs, exactly one source keeps its bare IDs and every other source receives a concern prefix. Choose the source that keeps bare IDs deterministically: the one the user designates; else the one already referenced by the most downstream artifacts; else the largest by item count; ties broken by the source supplied first. Record the choice in the ID change summary.

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

Every revision that changes IDs must return an ID change summary. A consolidation must also return one even when no IDs change, because `Consolidated` is the durable record of what was merged:

```
## ID Change Summary
- Added: <ids or none>
- Updated: <ids or none>
- Deferred: <ids or none>
- Superseded: <old -> new, or none>
- Removed: <ids or none>
- Consolidated: <which artifacts were merged into this one, or none>
```

When merging multiple same-kind artifacts into one, preserve every source ID. Re-namespace colliding IDs per the project-scoped rules above rather than dropping or renumbering them, and record the merge in `Consolidated`. Always emit this summary for a consolidation, even when no IDs collided or changed.

## Required Handoff Instructions

Every spec-revision handoff (amendment or open-question resolution) must instruct the receiving agent:

```
Preserve stable IDs. Do not renumber unchanged items.
Allocate new IDs only for new items.
Mark removed, deferred, or out-of-scope items explicitly.
Return an ID change summary.
```
