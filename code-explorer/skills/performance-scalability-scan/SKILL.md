---
name: performance-scalability-scan
description: "Use when: identifying likely performance, scalability, and resource-use issues in a codebase: unbounded loops over external input, N+1 queries, missing pagination, large in-memory buffers, synchronous blocking I/O, expensive serialization, regex hazards, retry storms, unbounded concurrency, missing backpressure, cache misuse, and heavy startup cost. Part of the Code Explorer workflow."
argument-hint: "Repository scope or a specific path; symbol inventory and data-flow findings if available."
user-invocable: true
---

# Performance and Scalability Scan

Identify likely performance, scalability, and resource-use issues. Findings are review prompts backed by evidence, not benchmarked conclusions.

Follow the evidence, confidence, and risk-label rules in the plugin's `shared/exploration-protocol.md`. The reference files live at the plugin root, sibling of `skills/`. When run standalone, those rules still apply; if a reference is unavailable, stop and report it.

## What to Look For

Unbounded loops over external input; N+1 queries; missing pagination; large in-memory buffers; synchronous blocking I/O on hot paths; expensive serialization; regex hazards (catastrophic backtracking); retry storms; unbounded concurrency; missing backpressure; cache misuse; unnecessary network calls; heavy startup cost; large dependency loading; poor batching.

## Procedure

1. Scan Tier 1 symbols and traced flows for the patterns above.
2. For each finding, capture the location, the pattern, why it could matter at scale, and a suggested benchmark or load test.
3. Add evidence-backed findings to the risk register (category `performance`) using the risk-label rules.

## Output

By default, integrate findings into `10_RISK_REGISTER.md` (category `performance`). When the user asks for a dedicated artifact, also write `18_PERFORMANCE_AND_SCALABILITY.md` and `machine-readable/performance_findings.json` per `shared/output-contracts.md`, with provenance stamps. Each finding carries a stable `PERF-*` ID (see `shared/stable-id-policy.md`); the schema (`shared/schemas/performance_findings.schema.json`) is already registered in the validator. When a finding is also recorded as a risk, cross-reference the `PERF-*` and `RISK-*` items.

## Rules

- Do not mark something a performance risk only because it looks slow. A risk needs evidence, a plausible scale at which it matters, and a suggested verification.
- Prefer suggesting a measurement over asserting a number you cannot source.
