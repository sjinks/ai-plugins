---
name: change-impact
description: "Use when: producing a change impact guide during deep codebase exploration: per-area direct and indirect dependencies, tests to run, contracts to preserve, compatibility and migration concerns, and safe-change strategies. Phase 11 of the Code Explorer workflow."
argument-hint: "Major components and flows from earlier phases, or the area to analyze when standalone."
user-invocable: false
---

# Change Impact Guide

Help future engineers and agents understand what may break when changing important areas. This is Phase 11 of the Code Explorer workflow; it synthesizes the architecture (Phase 3), entrypoints (Phase 4), flows (Phase 6), dependency graph (Phase 8), test map (Phase 9), and risk register (Phase 10).

Follow the evidence and confidence rules in the plugin's `shared/exploration-protocol.md`. Output contract: `11_CHANGE_IMPACT_GUIDE.md` in `shared/output-contracts.md`. Both reference files (`shared/exploration-protocol.md` and `shared/output-contracts.md`) live at the plugin root, sibling of `skills/`; output artifacts go under the explored repository's `docs/codebase-exploration/`. When run standalone, those rules still apply; if either reference is unavailable, stop and report it. When prior phase artifacts are absent (standalone use), derive dependencies and tests from direct code inspection, label them inferred, and note the missing inputs under the `## Limitations` section.

## Procedure

Cover each major component and each traced data flow as an `## Area:` section. For each area:

1. Summarize what the area does in one short paragraph (`### What it does`).
2. Identify likely direct dependencies (from the dependency graph edges).
3. Identify likely indirect dependencies (transitive consumers, shared state, shared schemas).
4. Identify the tests that should be run, with actual commands when known from Phase 2/9.
5. Identify contracts that must remain stable: public APIs, schemas, event shapes, CLI flags, config keys, file formats.
6. Identify config/schema/API compatibility concerns and migration or rollout concerns; record compatibility and migration concerns under `Risks when changing` and rollout concerns under `Observability / rollout checks`.
7. Identify observability checks: what to watch after a change (logs, metrics, alerts found during exploration).
8. State a safe-change strategy for the area (for example: extend-then-migrate, feature-flag, contract test first, refactor under existing tests).

## Rules

- Dependencies come from the actual graph and call sites, not topology guesses. Unverified indirect dependencies are labeled inferred.
- "Tests to run" must be runnable: name the command or the test files. If no tests protect the area, say so and link the matching gap/risk entry.
- Safe-change strategies must be specific to the area's actual constraints, not generic advice. "Write tests first" alone is filler; name which seam to test.
- Prioritize areas by risk: dangerous-to-change hotspots and high-risk flows come first. Skip trivial areas entirely.

## Output

Write `11_CHANGE_IMPACT_GUIDE.md` per `shared/output-contracts.md`, with a provenance stamp.
