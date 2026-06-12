---
name: risk-register
description: "Use when: consolidating exploration findings into an evidence-backed risk register during deep codebase exploration: security, correctness, reliability, performance, maintainability, data-integrity, configuration, deployment, and testing risks with severity, confidence, verification, and mitigation. Phase 10 of the Code Explorer workflow."
argument-hint: "Candidate risks and findings from earlier phases, or the repository scope when standalone."
user-invocable: true
---

# Risk Register Builder

Convert exploration findings into a practical risk register for engineering work. This is Phase 10 of the Code Explorer workflow; its primary input is the candidate risks collected by Phases 3-9. Do not produce generic warnings — every risk must have evidence.

Follow the evidence, confidence, and risk-label rules in the plugin's `shared/exploration-protocol.md`. Output contracts: `10_RISK_REGISTER.md` and `risks.json` in `shared/output-contracts.md`. Both reference files (`shared/exploration-protocol.md` and `shared/output-contracts.md`) live at the plugin root, sibling of `skills/`; output artifacts go under the explored repository's `docs/codebase-exploration/`. When run standalone, those rules still apply; if either reference is unavailable, stop and report it.

## Procedure

1. Gather candidate risks from earlier phase artifacts: architecture smells, entrypoint risks, data-flow security findings, symbol-level problems, dependency cycles and hotspots, test gaps. When standalone, gather from the findings the user supplies; if the user supplies only a repository scope and no findings, perform a light risk-focused scan of that scope (entrypoints, security-relevant sinks, test presence) and label the register as scan-based under `Limitations`.
2. Deduplicate: one risk per root cause, with all affected areas listed, not one risk per symptom.
3. For each risk record every required field: title; category; affected area; severity; confidence; evidence; why it matters; suggested verification; suggested mitigation; related tests or missing tests.
4. Assign severity and confidence per the protocol scales. Severity reflects plausible impact, not code ugliness.
5. Number risks `RISK-001`, `RISK-002`, ... In refresh mode, keep existing IDs stable; never renumber.

## Categories

Allowed category values — use only these, in both the markdown `Category:` field and the JSON:

`security` | `correctness` | `reliability` | `performance` | `maintainability` | `observability` | `data-integrity` | `configuration` | `deployment` | `testing` | `other`

Fine-grained labels to map FROM (never write these as the category): scalability → `performance`; migration → `data-integrity` or `deployment`; API compatibility → `correctness`; concurrency and async behavior → `reliability`; error handling → `correctness` or `reliability`; hidden coupling → `maintainability`. Keep the fine-grained wording in the risk title. Example: a race condition maps to enum `reliability`, title "Race condition in session refresh".

## Rules

- A risk without evidence is not a risk; it is an open question — move it to the open-questions artifact.
- "Complex code" alone is not a risk. Complexity becomes a risk only paired with impact evidence (high fan-in, no tests, security-sensitive role).
- `Suggested verification` must be a concrete action (a command, a test to write, a code path to inspect), not "investigate further".
- Every `Critical` and `High` risk must name related tests or explicitly state the missing test.

## Output

Write `10_RISK_REGISTER.md` and `machine-readable/risks.json` per `shared/output-contracts.md`, with provenance stamps. The markdown summary table counts risks by severity.
