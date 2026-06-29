# Model Panel Run Contract Reference

This reference defines the normalized input contract for a multi-model panel run. It is a local reference, not an invocable skill.

## Required Fields

- `target agent`: the agent name or reference to invoke for every model route.
- `task packet`: the exact task, prompt, review request, or work item to give the target agent.
- `models`: two or more model references or runtime routes.

If any required field is missing, ask one concise clarification question when interactive clarification is available. If clarification is unavailable, return `blocked` with the missing fields and, when possible, a reusable handoff template.

The target agent must not be `Model Panel Coordinator`, `Multi-Model Review Panel`, or another known Model Panel wrapper that delegates back into Model Panel. Recursive target selection returns `blocked` unless a future explicit non-recursive mode exists.

## Optional Fields

- `context`: repository excerpts, diff, artifacts, requirements, constraints, or other data to pass unchanged to every run.
- `harness/runtime`: the host or adapter expected to run the panel, such as Copilot, VS Code, CLI wrapper, or a user-defined harness.
- `run mode`: `parallel | sequential`; default `parallel` only when the host supports isolated independent invocations, otherwise `sequential`.
- `synthesis mode`: `auto | format-preserving | evidence-preserving | raw-only`; default `auto`.
- `timeout`: host-defined maximum wait per route, if supported.
- `success criteria`: user-supplied conditions for a useful combined result.
- `raw-output policy`: `include | artifact-reference | redact-sensitive`; default `include` with sensitive-data redaction by category when needed.

## Report-Only Target Gate

Model Panel must not be used to execute mutating work through a target agent. If the target agent or task requires file edits, shell commands, git or PR mutation, deployment, dependency installation, package publishing, or any external write, ask for a read-only analysis/review/planning reformulation or return `blocked`.

Before routing, the host or harness must provide read-only capability evidence for the target invocation: mutating tools are absent, disabled, or sandboxed for every route, or the target agent is otherwise enforced as read-only by the host. If that cannot be verified, return `blocked` or emit manual run packets; do not rely on prompt intent alone.

## Identical Packet Rule

The panel tests model behavior, not prompt variants. The target agent, task packet, context, constraints, output instructions, and allowed source material must be identical for every model route. Only model routing metadata may differ.

In short: same target agent, same task packet, same context, same constraints, and same output instructions; only the model route changes.

Do not add per-model role guidance, scoring rubrics, confidence nudges, examples, or style preferences. Do not show any model another model's output during the run phase.

The Coordinator must assign one `input packet id` to the canonical packet and attach that same id to every run record. The final report must include the exact canonical packet, a host artifact reference, or a stable digest; if none can be retained, return `partial` with an explicit limitation because the identical-packet invariant is not auditable.

## Run Record

Every requested model route produces one run record:

```markdown
- model: <requested label>
  actual model: <reported label or unknown>
  input packet id: <canonical packet id>
  harness: <adapter or host>
  target agent: <agent name>
  status: succeeded | failed | timed-out | blocked | skipped
  diagnostics: <routing/runtime notes or None>
  raw output: <verbatim output, artifact reference, or redacted category>
```

`skipped` is allowed only when an earlier feasibility check proves the route cannot run. `blocked` is used when the route needs missing user input, unavailable model selection, unavailable target agent invocation, or an unsafe/sensitive-data condition.

## Panel Status

- `completed`: every requested model route succeeded or every requested externally supplied output passed the fallback status matrix, at least two distinct actual model identities or routing keys produced useful outputs, the same `input packet id` is recorded for every route or external output, compatibility and synthesis rules were applied, and raw outputs or artifact references were retained.
- `partial`: at least one route succeeded, but one or more requested routes failed, timed out, were blocked, model-route identity could not be verified, requested routes collapsed to fewer than two distinct actual model identities or routing keys, the canonical packet evidence could not be retained, or requested format-preserving synthesis could not complete.
- `blocked`: no route could be run or required input is missing.
- `raw-only`: the user requested collection without semantic synthesis, and the raw-output policy was satisfied.

## Fallback Status Matrix

- Direct routed runs follow the Panel Status rules above.
- Fixed-model alias agents are `partial` unless alias definitions, route evidence, read-only capability evidence, and canonical packet evidence prove no material wrapper differences. When that proof exists, classify by the normal `completed | partial | blocked | raw-only` rules.
- User-supplied raw outputs can be `completed` only when every requested output is present, each output has model provenance, the canonical packet evidence matches every output, at least two distinct actual model identities or routing keys are represented, and the raw-output policy is satisfied.
- Partial external outputs are `partial` when at least one useful output exists. No runnable routes and no useful supplied output is `blocked`.

## Model Identity

Record model labels exactly as requested and actual labels exactly as reported by the host. If the host cannot prove that different requested routes used different models, mark model identity as a limitation and do not present the result as a true multi-model comparison.

Requested model labels should identify at least two intended routes. If requested labels are duplicates, aliases resolve to the same actual model, or the host proves the routes collapsed to one actual model, do not treat agreement as multi-model convergence. Mark the panel `partial` when at least one useful output exists, label the evidence as repeated single-model evidence, and cap synthesized confidence at `medium` unless external evidence supports a stronger claim.