---
name: error-observability-audit
description: "Use when: reviewing how a codebase represents, propagates, logs, observes, and recovers from failures: swallowed exceptions, generic error responses, inconsistent error mapping, missing timeouts/retries, unsafe retries, missing cancellation, partial-failure behavior, missing or noisy or sensitive logs, missing failure metrics, and missing correlation IDs. Part of the Code Explorer workflow."
argument-hint: "Repository scope; symbol inventory, data-flow, and observability findings if available."
user-invocable: true
---

# Error Handling and Observability Audit

Review how failures are represented, propagated, logged, observed, and recovered. This complements the observability map (which catalogues signals) by auditing failure behavior specifically.

Follow the evidence, confidence, and risk-label rules in the plugin's `shared/exploration-protocol.md`. The reference files live at the plugin root, sibling of `skills/`. When run standalone, those rules still apply; if a reference is unavailable, stop and report it.

## What to Look For

Swallowed exceptions; generic error responses; inconsistent error mapping; missing timeouts; missing retries; unsafe retries (non-idempotent); missing cancellation; partial-failure behavior; missing structured logs; noisy logs; sensitive logs; missing metrics around failures; missing correlation IDs.

## Procedure

1. Scan Tier 1 symbols and traced flows for the failure patterns above, focusing on error paths.
2. For each finding, capture the location, the failure behavior, and the operational consequence (silent failure, lost work, missing alert).
3. Route findings to the right artifact: error-handling correctness and reliability issues to `10_RISK_REGISTER.md`; missing visibility to `16_OBSERVABILITY_MAP.md`.

## Rules

- A swallowed exception is reported with the catch site as evidence.
- Sensitive data in logs forwards to the security skill / risk register.
- Distinguish "no retry" (sometimes correct) from "unsafe retry on a non-idempotent operation" (a finding); state which.

## Output

Integrate findings into `10_RISK_REGISTER.md` (categories `correctness`, `reliability`, `observability`) and `16_OBSERVABILITY_MAP.md` as appropriate, with cross-references.
