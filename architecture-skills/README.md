# architecture-skills

A plugin that ships a set of architecture and design workflow skills for AI agents. Each skill targets a specific design-time decision that is expensive to get wrong: undocumented decisions, unweighed tradeoffs, leaky interfaces, risky dependency choices, undesigned failure behavior, type designs that allow invalid states, and unsafe data migrations.

The skills are not hooks and do not intercept anything. They load by description-trigger matching: when the agent works on an architecture or design task, the matching skill's vocabulary triggers and its checklist is loaded into context. Each skill is also user-invocable as a slash command.

## What ships

- `skills/architecture-decision-record/` — write, rewrite, or audit an architecture decision record against an eight-field contract (title, status, context, decision drivers, real options with costs, decision, positive and negative consequences, revisit triggers) so decisions stay reconstructible.
- `skills/architecture-tradeoff-analysis/` — compare candidate architectures against weighted quality attributes with a strong/adequate/weak/unknown score table, mandatory per-option costs, constraint-based elimination, and a recommendation or deciding question — never a decision made for the owner.
- `skills/interface-contract-design/` — design or audit a boundary's contract before implementation: per-operation inputs, outputs, distinguishable errors, idempotency, side effects, ordering, versioning posture, and single-owner invariants, with implementation leakage flagged.
- `skills/dependency-choice-review/` — make design-time build-vs-adopt decisions on libraries, frameworks, services, and platforms across maintenance health, API stability, fit, lock-in and exit, operational burden, and license/policy, with exit paths and reversal triggers.
- `skills/failure-mode-design/` — decide failure behavior at design time: sweep each component→dependency edge across slow, down, wrong, and partial failure shapes, assign one degradation policy per edge with a concrete blast radius and observability signal, and settle idempotency under retry for every mutating flow.
- `skills/type-safe-design/` — design, review, refactor, and test-plan type-safe architecture where contracts, validation states, generics, reflection, factories, and compiler feedback affect correctness and change locality.

## Slash commands

After installation, each skill is invocable on demand:

```
/architecture-decision-record
/architecture-tradeoff-analysis
/interface-contract-design
/dependency-choice-review
/failure-mode-design
/type-safe-design
```

## Where each skill fits

| Stage | Skill |
|---|---|
| Choosing between approaches | `architecture-tradeoff-analysis`, `dependency-choice-review` |
| Recording the decision | `architecture-decision-record` |
| Designing the boundaries | `interface-contract-design`, `type-safe-design` |
| Designing for failure | `failure-mode-design` |

## Scope

- Documentation + checklist skills only. No hooks. No execution interception.
- Skills load when their description vocabulary matches, and can be invoked explicitly as slash commands.
