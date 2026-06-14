---
name: dependency-graph
description: "Use when: analyzing module dependencies and hotspots during deep codebase exploration: module-level dependency graph, high fan-in/fan-out modules, cycles, cross-layer imports, change-dangerous modules, and churn-based hotspots. Phase 8 of the Code Explorer workflow."
argument-hint: "Repository scope; architecture layers and symbol inventory if available."
user-invocable: false
---

# Dependency Graph and Hotspot Analysis

Understand coupling, dependency structure, and architectural hotspots. This is Phase 8 of the Code Explorer workflow; architecture layers (Phase 3) define what counts as a cross-layer violation.

Follow the evidence and safety rules in the plugin's `shared/exploration-protocol.md` — in particular: use only already-installed tools. Output contracts: `08_DEPENDENCY_GRAPH.md` and `machine-readable/dependency_graph.json` in `shared/output-contracts.md`. Both reference files (`shared/exploration-protocol.md` and `shared/output-contracts.md`) live at the plugin root, sibling of `skills/`; output artifacts go under the explored repository's `docs/codebase-exploration/`. When run standalone, those rules still apply; if either reference is unavailable, stop and report it.

## Tasks

1. Build a module-level dependency graph from imports/includes/uses.
2. Identify high fan-in modules (many dependents — risky to change).
3. Identify high fan-out modules (many dependencies — unstable).
4. Identify dependency cycles.
5. Identify cross-layer imports that violate the layering from the architecture overview. When no architecture overview exists (standalone use), skip this and record it under the `## Limitations` section.
6. Identify modules likely dangerous to change (high fan-in plus complexity plus weak tests); record verdicts under `Hotspots`.
7. Identify dead or unused code if feasible with available tools; record findings under `Hotspots`, otherwise skip and note it under the `## Limitations` section.
8. If git history is available, compute churn hotspots: most frequently changed files crossed with fan-in. `git log --pretty=format: --name-only | sort | uniq -c | sort -rn | head -20` is sufficient.

## Tooling by Language

Use only if already installed; verify with `which`/`--version` first:

- JavaScript/TypeScript: `madge`, `dependency-cruiser`, `tsc --noEmit`.
- PHP: Psalm, PHPStan, Composer autoload map.
- C/C++: clangd, clang-query, CMake target graph.
- Go: `go list -deps`, `go vet`.
- Rust: `cargo metadata`, `cargo clippy` (only with session test/build approval, since clippy compiles).

If no tool is available, build the graph with best-effort import searches (`rg "^import|^use|require\("` patterns adapted to the language) and state the method and its blind spots under the `## Limitations` section.

## Rules

- Module granularity: directory or package level for the diagram (cap ~20 nodes); file level only inside identified hotspots.
- Every edge in the JSON graph carries evidence (the importing file). No inferred edges.
- A cycle is reported with its member list and one concrete import path that closes it.
- "Dangerous to change" verdicts require at least two signals (fan-in, complexity, churn, missing tests) and cite all of them.

## Output

Write `08_DEPENDENCY_GRAPH.md` and `machine-readable/dependency_graph.json` per `shared/output-contracts.md`, with provenance stamps. Hotspots and cycles forward to the risk register (Phase 10) and change impact guide (Phase 11).
