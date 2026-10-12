# architecture-skills

A plugin that ships architecture and design workflow skills for AI agents. The skills cover decision records, tradeoffs, interface contracts, dependency choices, failure behavior, type-safe design, and development container planning.

## Packaging

The root `plugin.json` declares this package using the portable Agent Plugins 1.0 schema. Skill definitions live in the shared `skills/` directory. Host discovery and invocation behavior depend on the installed client and its configuration.

The skills are not hooks and do not intercept anything. Their descriptions state when each skill applies; a compatible host can use those descriptions for discovery.

## What ships

- `skills/architecture-decision-record/` — write, rewrite, or audit an architecture decision record against an eight-field contract (title, status, context, decision drivers, real options with costs, decision, positive and negative consequences, revisit triggers) so decisions stay reconstructible.
- `skills/architecture-tradeoff-analysis/` — compare candidate architectures against weighted quality attributes with a strong/adequate/weak/unknown score table, mandatory per-option costs, constraint-based elimination, and a recommendation or deciding question — never a decision made for the owner.
- `skills/interface-contract-design/` — design or audit a boundary's contract before implementation: per-operation inputs, outputs, distinguishable errors, idempotency, side effects, ordering, versioning posture, and single-owner invariants, with implementation leakage flagged.
- `skills/dependency-choice-review/` — make design-time build-vs-adopt decisions on libraries, frameworks, services, and platforms across maintenance health, API stability, fit, lock-in and exit, operational burden, and license/policy, with exit paths and reversal triggers.
- `skills/failure-mode-design/` — decide failure behavior at design time: sweep each component→dependency edge across slow, down, wrong, and partial failure shapes, assign one degradation policy per edge with a concrete blast radius and observability signal, and settle idempotency under retry for every mutating flow.
- `skills/type-safe-design/` — design, review, refactor, and test-plan type-safe architecture where contracts, validation states, generics, reflection, factories, and compiler feedback affect correctness and change locality.
- `skills/dev-container-generation/` — plan a development container setup (Dockerfile, `.dockerignore`, optional `compose.yaml`) from an architecture spec and repository evidence, covering base-image pins, dependency caching, dev affordances, backing services, non-root use, and secret-safe configuration. Build and configuration checks are recommended follow-up actions, not checks the skill executes.

## Skill names

Use these names to select a skill where the host supports explicit invocation:

```
architecture-decision-record
architecture-tradeoff-analysis
interface-contract-design
dependency-choice-review
failure-mode-design
type-safe-design
dev-container-generation
```

## Where each skill fits

| Stage | Skill |
|---|---|
| Choosing between approaches | `architecture-tradeoff-analysis`, `dependency-choice-review` |
| Recording the decision | `architecture-decision-record` |
| Designing the boundaries | `interface-contract-design`, `type-safe-design` |
| Designing for failure | `failure-mode-design` |
| Containerizing for development | `dev-container-generation` |

## Scope

- Skill instructions and references only. No hooks or execution interception.
- Actual discovery and explicit invocation syntax depend on the host.
