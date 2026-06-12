---
name: architecture-overview
description: "Use when: producing a system-level architecture model during deep codebase exploration: major components, layers, boundaries, dependency direction, architectural patterns, recovered design decisions, and architecture smells. Phase 3 of the Code Explorer workflow."
argument-hint: "Repository scope; repository map and build/runtime findings if available."
user-invocable: true
---

# Architecture Overview

Produce a system-level architecture model grounded in evidence. This is Phase 3 of the Code Explorer workflow; it builds on the repository map (Phase 1) and build/runtime model (Phase 2).

Follow the evidence, confidence, and inference-label rules in the plugin's `shared/exploration-protocol.md`. Output contract: `03_ARCHITECTURE_OVERVIEW.md` in `shared/output-contracts.md`. Both reference files (`shared/exploration-protocol.md` and `shared/output-contracts.md`) live at the plugin root, sibling of `skills/`; output artifacts go under the explored repository's `docs/codebase-exploration/`. When run standalone, those rules still apply; if either reference is unavailable, stop and report it.

## Tasks

1. Identify major components and their paths.
2. Identify architectural layers and the boundaries between components.
3. Identify dependency direction between components.
4. Identify core flows at component level (detailed tracing happens in Phases 4 and 6).
5. Identify storage and integration points.
6. Identify architectural patterns. Candidates: MVC; hexagonal architecture; service/repository; event-driven; layered monolith; microservices; plugin architecture; command bus; queue consumers; RPC; REST/GraphQL; CLI-first design.
7. Identify architecture smells with evidence. Candidates: cyclic dependencies; god services; mixed concerns; leaky abstractions; implicit global state; hidden I/O; excessive coupling.
8. Recover likely architecture decisions from code, tests, docs, and git history into the `Recovered design decisions` table. Label each decision `Confirmed`, `Inferred`, or `Speculative`, with evidence and consequences. Example row: `| Repository pattern over raw queries | Inferred | All DB access goes through src/repos/*; no direct driver calls elsewhere | Schema changes are localized to repos |`.

## Rules

- Separate `Confirmed architecture facts` from `Inferred architecture` strictly. A pattern name is confirmed only when the code or docs state it; structural resemblance alone is inferred.
- A smell is reported only with evidence and a concrete affected area; "looks complex" is not a smell.
- Use one high-level Mermaid `flowchart` diagram. Keep it under ~15 nodes; detail belongs in later phases.
- Component table rows need `Depends on` and `Used by` filled from actual imports/calls or marked `unknown`.
- Feed identified smells and risks forward: they become candidate entries for the risk register (Phase 10).

## Output

Write `03_ARCHITECTURE_OVERVIEW.md` per `shared/output-contracts.md`, with a provenance stamp. Unresolved structural questions go in `Open architecture questions` and forward to the consolidated open-questions artifact.
