---
name: entrypoint-tracing
description: "Use when: discovering and tracing system entrypoints during deep codebase exploration: HTTP routes, CLI commands, queue consumers, cron jobs, webhooks, event listeners, exported library APIs, with validation, auth, side effects, call chains, and per-entrypoint risk. Phase 4 of the Code Explorer workflow."
argument-hint: "Repository scope; architecture overview if available; any entrypoint focus."
user-invocable: true
---

# Entrypoint Tracing

Find all meaningful ways execution enters the system and trace the highest-risk ones. This is Phase 4 of the Code Explorer workflow; it requires the architecture overview (Phase 3) so traces land in known components.

Follow the evidence, budget, and risk-label rules in the plugin's `shared/exploration-protocol.md`. Output contracts: `04_ENTRYPOINTS.md` and `entrypoints.json` in `shared/output-contracts.md`. Both files live at the plugin root, sibling of `skills/`. When run standalone, those rules still apply; if either reference is unavailable, stop and report it.

## Entrypoint Categories

Search for: HTTP routes/controllers/handlers; GraphQL resolvers; RPC methods; CLI commands; queue consumers; cron/scheduled jobs; webhooks; event listeners; exported library APIs; plugin hooks; framework lifecycle methods; server startup files; migration scripts; test-only entrypoints.

## Procedure

1. Enumerate all entrypoints into the summary table first. For each: name, type, file, auth presence, side effects, risk, confidence.
2. Assign per-entrypoint risk using the severity scale in the protocol. Risk drivers: unauthenticated input, security-relevant sinks reachable, write side effects, weak/no validation, no test coverage. Anchor examples: unauthenticated input + write side effect + no validation found ⇒ `Critical`; authenticated read-only with test coverage ⇒ `Low`; in between, more drivers means higher risk.
3. Select entrypoints for deep tracing by risk, within the trace budget (default: top 10).
4. For each traced entrypoint, document: location (file/symbol); trigger mechanism; input data; validation; authentication; authorization; called services; side effects; error handling; tests; risks; and at least one representative call chain from trigger to dependency.

## Rules

- Every call chain step must be backed by an actual call you located. If a chain segment cannot be verified, end the chain there and write `-> unknown`.
- "No validation found" and "no auth found" are reportable findings — state where you looked.
- Entrypoints beyond the trace budget stay in the summary table; note the sampling decision under `Limitations`.
- Test-only entrypoints are listed but never deep-traced unless the user asks.
- Set `traced` in the JSON for every entry. Set confidence from evidence as normal; do not use confidence to mark trace status.
- Security-relevant findings (missing auth, unvalidated input reaching a sink) forward to the data-flow phase (Phase 6) and risk register (Phase 10).

## Output

Write `04_ENTRYPOINTS.md` and `machine-readable/entrypoints.json` per `shared/output-contracts.md`, with provenance stamps. The JSON includes every enumerated entrypoint, traced or not.
