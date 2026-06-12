---
name: dataflow-trust-boundaries
description: "Use when: tracing data flows and trust boundaries during deep codebase exploration: sources to sinks, validation and sanitization points, security-relevant sinks (SQL, shell, filesystem, HTTP, templates, deserialization, redirects, auth decisions), and failure modes. Phase 6 of the Code Explorer workflow."
argument-hint: "Repository scope; traced entrypoints if available; any flow focus."
user-invocable: true
---

# Data Flows and Trust Boundaries

Understand how data moves through the system and where trust changes. This is Phase 6 of the Code Explorer workflow; it starts from the traced entrypoints (Phase 4).

Follow the evidence, budget, and risk-label rules in the plugin's `shared/exploration-protocol.md`. Output contracts: `06_DATAFLOWS_AND_TRUST_BOUNDARIES.md` and `dataflows.json` in `shared/output-contracts.md`. Both reference files (`shared/exploration-protocol.md` and `shared/output-contracts.md`) live at the plugin root, sibling of `skills/`; output artifacts go under the explored repository's `docs/codebase-exploration/`. When run standalone, those rules still apply; if either reference is unavailable, stop and report it. When no traced entrypoints exist, identify candidate flows directly from visible entrypoints/handlers and record the missing prerequisite under `Limitations`.

## Procedure

1. Select flows to trace by risk and business importance, within the flow budget (default: top 5). Prefer flows from high-risk entrypoints and flows crossing the most trust boundaries.
2. For each flow, follow input data through validation, transformation, business logic, storage, external APIs, logs, metrics, and output.
3. Mark every trust boundary the data crosses. Trust changes at: user input; external API responses; database data; filesystem data; environment variables; queue messages; cached data; generated data; internal service calls.
4. Identify security-relevant sinks the data reaches: SQL/query builders; shell execution; filesystem writes/reads; HTTP requests; template rendering; HTML/Markdown rendering; deserialization; logging; metrics labels; redirects; auth decisions.
5. For each source-to-sink path, identify the validation and sanitization applied — or its absence, stating where you looked.
6. Identify error handling and partial-failure behavior along the flow (what happens when a mid-flow step fails after earlier side effects).

## Security Checklist

While tracing, also flag for the risk register: authentication/authorization gaps; injection-capable sinks fed by untrusted data; secrets in code or logs; sensitive data logged or exposed in errors; SSRF-capable HTTP clients with user-controlled URLs; unsafe deserialization; missing rate limits on expensive flows.

## Rules

- Every flow step is backed by located code. End unverifiable segments with `unknown` in the diagram and trust-boundary table.
- "Validated at the boundary" requires citing the validating symbol. Validation deep inside business logic counts but note the unvalidated distance from the boundary. Example trust-boundary row: `| User input -> handler | POST body | zod schema in src/api/orders.ts | Low |`.
- Untrusted data reaching a security-relevant sink without identified validation is a finding, with severity per the protocol's risk scale.
- Diagrams: one Mermaid `flowchart` per flow, focused on trust boundaries and sinks, not every function call.
- Flows beyond the budget: list by name with entrypoint and one-line summary under the artifact's top-level `## Limitations` section.

## Output

Write `06_DATAFLOWS_AND_TRUST_BOUNDARIES.md` and `machine-readable/dataflows.json` per `shared/output-contracts.md`, with provenance stamps. Security findings forward to the risk register (Phase 10).
