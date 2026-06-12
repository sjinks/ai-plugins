---
name: symbol-inventory
description: "Use when: building a tiered function and symbol inventory during deep codebase exploration: deep analysis of critical symbols, brief summaries of supporting symbols, index-only treatment of trivial ones, with callers, callees, side effects, error behavior, and tests. Phase 7 of the Code Explorer workflow."
argument-hint: "Repository scope; entrypoint, architecture, and data-flow findings if available."
user-invocable: true
---

# Function and Symbol Inventory

Create a structured inventory of functions, methods, classes, and modules that supports navigation and risk analysis. This is Phase 7 of the Code Explorer workflow. In the orchestrated workflow, do not run it before entrypoints (Phase 4) and architecture (Phase 3) — tier assignment depends on them. When run standalone without those artifacts, derive tier signals from exports, entrypoint patterns, and fan-in/fan-out heuristics, and record the lowered confidence under `Limitations`.

Follow the evidence, budget, and prioritization rules in the plugin's `shared/exploration-protocol.md`. Output contracts: `07_FUNCTION_AND_SYMBOL_INVENTORY.md`, `symbol_index.json`, and `important_functions.json` in `shared/output-contracts.md`. Both files live at the plugin root, sibling of `skills/`. When run standalone, those rules still apply; if either reference is unavailable, stop and report it.

## Tier Classification

**Tier 1 — Critical (deep analysis, within the Tier 1 budget, default 40 symbols):** entrypoint handlers; public API methods; exported functions/classes that carry behavior; core services; domain logic; security-sensitive functions; validation/auth/authz functions; database access functions; filesystem/network/shell functions; complex algorithms; high fan-in or high fan-out functions; functions on traced data flows.

**Tier 2 — Supporting (one-line summary in the `purpose` field of its `symbol_index.json` entry; not in the markdown):** internal helpers; adapters; mapping functions; utilities used by Tier 1 code; test helpers with behavioral meaning.

**Tier 3 — Trivial (index only, no prose):** simple getters/setters; thin wrappers; obvious constants; framework boilerplate; simple re-exports.

## Procedure

1. Build the symbol index using available static tools (LSP, compiler API, ctags, language-aware search). Record which method was used under `Limitations`.
2. Mark exported/public symbols.
3. Assign tiers. Example: an exported DB-write function with 12 callers is Tier 1; a private date-format helper is Tier 2; a generated getter is Tier 3. When Tier 1 candidates exceed the budget, rank by risk and fan-in/fan-out, keep the top entries, demote the rest to Tier 2, and record the cut under `Limitations`.
4. For each Tier 1 symbol document: purpose; inputs; outputs; callers; callees (only from actual call sites you located — otherwise `unknown`, never guessed); side effects; error behavior; invariants; security assumptions; tests; potential problems; confidence.

## Performance and Error-Handling Checklist

While analyzing Tier 1 symbols, flag for the risk register: nested loops over unbounded input; N+1 query patterns; synchronous blocking I/O on hot paths; unbounded concurrency; missing pagination; swallowed exceptions; missing timeouts/retries/cancellation on network calls; generic catch-all error mapping; sensitive data in logs.

## Rules

- The inventory must not become prose documentation of every helper. Tier 3 gets a JSON index row and nothing else.
- A side effect is recorded only when located in the code (or in a directly called dependency). "Probably writes to the DB" is not a side effect; it is an open question.
- `Tests` lists the actual test files/cases exercising the symbol, or `none found` with the search locations.
- Confidence per symbol entry; symbols analyzed only from signatures are at most `Medium`.

## Output

Write `07_FUNCTION_AND_SYMBOL_INVENTORY.md`, `machine-readable/symbol_index.json` (all tiers), and `machine-readable/important_functions.json` (Tier 1 only) per `shared/output-contracts.md`, with provenance stamps.
