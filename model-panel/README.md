# model-panel

Model Panel is a multi-model agent orchestration plugin. It runs the same target agent task through multiple model routes, preserves every raw output, checks whether the outputs share a compatible format, and returns either a format-preserving synthesis or an evidence-preserving summary.

The core design treats the target agent as a black box. The runner keeps the target agent, task, context, and output instructions identical for every run; only the model route changes.

## What ships

- `agents/model-panel-coordinator.agent.md` - generic orchestration entrypoint for arbitrary named agents, tasks, model lists, and host harnesses.
- `agents/multi-model-review-panel.agent.md` - review-oriented convenience wrapper that prepares a review packet and delegates the multi-model run to the Coordinator.
- `shared/run-contract.md` - normalized input fields, identical-packet rule, run records, and status semantics.
- `shared/harness-adapters.md` - direct model routing, fixed-model alias agents, manual run packets, and Copilot/VS Code feasibility notes.
- `shared/format-compatibility.md` - structural compatibility checks for arbitrary outputs.
- `shared/synthesis-policy.md` - evidence, deduplication, disagreement, confidence, and raw-output retention rules.
- `shared/report-contract.md` - required panel report shape.
- `shared/model-routing-safety.md` - source priority, prompt-injection, sensitive-data, and routing-scope guardrails.
- `shared/review-panel.md` - review-specific packet construction and synthesis guidance.

## Inputs

Model Panel accepts:

- a target agent name or reference;
- one task packet for that target agent;
- two or more model references, such as Copilot-hosted and VS Code-hosted model labels;
- optional context, constraints, success criteria, and synthesis mode.

If a host cannot invoke the arbitrary target agent with an explicit model route, the Coordinator reports that limitation and emits manual per-model run packets instead of pretending the run happened.

## Workflow

1. Normalize the target agent, task, context, model list, synthesis mode, and harness/runtime constraints.
2. Block mutating target-agent tasks unless the user reformulates them as read-only analysis, review, or planning.
3. Block recursive Model Panel wrapper targets and require read-only capability evidence for the target invocation.
4. Check whether the current host can invoke the target agent with the requested model routes.
5. Build one canonical run packet, assign one input packet id, and reuse it for every model.
6. Invoke each route without passing one model's output into another model's run.
7. Collect status, diagnostics, input packet id, actual model identity when exposed, and raw output for every model.
8. Check output format compatibility.
9. Produce a format-preserving synthesis when safe, otherwise produce an evidence-preserving summary.
10. Include raw outputs or an explicit redaction/omission reason in the final report.

## Synthesis Modes

- `auto` - infer compatibility; use format-preserving synthesis when compatible and evidence-preserving summary otherwise.
- `format-preserving` - require a compatible shared format; return `partial` or `blocked` if compatibility cannot be established.
- `evidence-preserving` - summarize agreements, unique claims, disagreements, and confidence without preserving the target format.
- `raw-only` - collect and report raw outputs without semantic synthesis.

## Scope

- Agent orchestration and synthesis only.
- No code edits, commits, pushes, PR actions, deployments, package publishing, or dependency installation.
- No assumption that arbitrary agents produce structured findings, JSON, Markdown headings, or any other known format.
- No majority vote without evidence; convergence increases confidence, but unsupported claims remain unsupported.
- No multi-model convergence claim when requested routes collapse to the same actual model or routing key.
- No raw secrets, credentials, tokens, PII, customer data, or production identifiers in reports.

## Development Checks

Run the static instruction lint before publishing Model Panel prompt changes:

```bash
node dev/model-panel/scripts/lint-model-panel.mjs
```