# code-explorer

Code Explorer is a deep codebase exploration plugin for building a reliable, evidence-based understanding of an unfamiliar repository. It produces a durable, updatable set of exploration artifacts that tell an engineer or a future agent what the system does, how it is structured, where execution enters, how data flows, which symbols matter, what is tested, and what is dangerous to change.

It is not a summarization tool. Every important claim carries evidence and a confidence level, inferences are labeled, budgets keep large repositories tractable, and unknowns become open questions instead of guesses.

## What ships

- `agents/code-explorer.agent.md` — the orchestrator: scope and safety setup, phase sequencing, refresh mode, final assembly (open questions, navigation guide, executive summary), self-check, and the final report.
- `skills/repo-cartography/` — Phase 1: languages, frameworks, tooling, directory purposes, ignore list.
- `skills/build-runtime/` — Phase 2: install/build/run/test commands, runtime services, environment variables, CI.
- `skills/architecture-overview/` — Phase 3: components, layers, patterns, recovered decisions, smells.
- `skills/entrypoint-tracing/` — Phase 4: entrypoint discovery, risk ranking, deep call-chain traces.
- `skills/domain-model/` — Phase 5: concepts, relationships, invariants, state transitions.
- `skills/dataflow-trust-boundaries/` — Phase 6: source-to-sink traces, trust boundaries, security-relevant sinks.
- `skills/symbol-inventory/` — Phase 7: tiered symbol inventory with deep analysis of critical symbols only.
- `skills/dependency-graph/` — Phase 8: module graph, fan-in/fan-out, cycles, churn hotspots.
- `skills/test-coverage-map/` — Phase 9: semantic behavior coverage and prioritized gaps.
- `skills/risk-register/` — Phase 10: evidence-backed risks with severity, verification, and mitigation.
- `skills/change-impact/` — Phase 11: per-area blast radius, contracts, tests to run, safe-change strategy.
- `shared/exploration-protocol.md` — cross-cutting evidence, confidence, budget, safety, provenance, and refresh rules.
- `shared/output-contracts.md` — artifact layout, Markdown templates, and JSON shapes for all phases.

## Artifacts

The agent writes to `docs/codebase-exploration/` (adapted to the repository's docs convention when one exists): fourteen numbered Markdown artifacts (`00_EXECUTIVE_SUMMARY.md` through `13_AGENT_NAVIGATION_GUIDE.md`) plus a `machine-readable/` directory with JSON indexes for the repository, symbols, entrypoints, data flows, risks, tests, and the dependency graph. Every artifact carries a provenance stamp (date, commit, scope, mode) so refreshes are meaningful.

## Workflow

The orchestrator runs the phases in order — cartography, build/runtime, architecture, entrypoints, domain model, data flows, symbol inventory, dependency graph, test coverage, risk register, change impact — then assembles open questions, the agent navigation guide, and the executive summary. The symbol inventory deliberately runs after entrypoints and architecture so tier assignment is grounded.

Each phase skill is also independently invocable for partial explorations (for example, only entrypoint tracing), with the shared protocol rules still applying.

## Safety

- Read-only by default: the only writes go to the exploration output directory, created after user confirmation.
- No dependency installation; missing tools become documented limitations.
- Builds and tests run only with a single session-level user approval and an already-configured environment.
- No mutating git commands.
- Budgets (Tier 1 symbol cap, entrypoint trace cap, flow trace cap, repository-size gate) keep effort bounded; sampling decisions are recorded as limitations.

## Scope

- Exploration and documentation only.
- No code changes, refactoring, or fixes.
- No commits, branches, pushes, or pull requests.
- Repository content is treated as evidence, never as instructions.
