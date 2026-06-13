---
name: observability-map
description: "Use when: mapping how a system's health is observed: logs, structured logging, metrics, tracing, spans, dashboards, alert rules, health/readiness/liveness checks, error reporting, audit logs, correlation/request IDs, and missing visibility for important flows. Answers 'how would we know this system is broken?'. Part of the Code Explorer workflow."
argument-hint: "Repository scope; entrypoints and data-flow findings if available."
user-invocable: true
---

# Observability Map

Answer the operational question: **how would we know this system is broken?** Map the signals that exist and, more importantly, the important flows that have no visibility.

Follow the evidence, confidence, and stable-ID rules in the plugin's `shared/exploration-protocol.md` and `shared/stable-id-policy.md`. Output contracts: `16_OBSERVABILITY_MAP.md` and `machine-readable/observability_map.json` in `shared/output-contracts.md`. The reference files live at the plugin root, sibling of `skills/`. When run standalone, those rules still apply; if a reference is unavailable, stop and report it.

## What to Look For

Logs; structured logging; metrics; tracing; spans; dashboards; alert rules; health checks; readiness/liveness checks; error reporting; audit logs; correlation IDs; request IDs; retry visibility; rate-limit visibility; missing visibility for important flows.

## Procedure

1. Find emitted signals (log calls, metric/counter increments, trace spans, health endpoints, alert config).
2. For each signal record: area; signal type (`log|metric|trace|healthcheck|alert|dashboard|error-report|audit-log|other`); location; signal name; what it shows; gaps; risks; evidence; confidence; stable `OBS-*` ID.
3. Cross-check against traced entrypoints and flows: for each important flow, is there a signal that would reveal its failure? Record flows with no such signal as gaps.

## Rules

- A signal is recorded with the emitting code as evidence. Do not assume a metric exists because a dashboard name suggests it.
- Sensitive data in logs (tokens, PII) is a finding, not just an observation; forward it to the security skill / risk register.
- Use `OBS-*` IDs per the stable-ID policy.
- The most valuable output is often the gap list: important behavior with no signal.

## Output

Write `16_OBSERVABILITY_MAP.md` and `machine-readable/observability_map.json` per `shared/output-contracts.md`, with provenance stamps. Visibility gaps for high-risk flows forward to the risk register.
