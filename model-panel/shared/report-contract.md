# Model Panel Report Contract Reference

This reference defines the required final report shape. It is a local reference, not an invocable skill.

## Panel Run Report

Return this shape for every Model Panel run:

```markdown
## Panel Status
`completed | partial | blocked | raw-only` - <rationale>

## Request
- target agent: <agent name or unknown>
- task: <short task label>
- models requested: <labels>
- harness/runtime: <host or unknown>
- synthesis mode: auto | format-preserving | evidence-preserving | raw-only

## Canonical Packet
- input packet id: <stable id or digest>
- packet evidence: <exact canonical packet, host artifact reference, stable digest, or explicit limitation>

## Run Matrix
- <one run record per requested model route>

## Format Compatibility
`compatible | mismatch | inconclusive | not-applicable` - <rationale and checked structure>

## Combined Result
<format-preserving synthesis, evidence-preserving summary, raw-only note, or blocked reason>

## Provenance And Confidence
- <combined claim or output section mapped to source model labels and confidence>

## Raw Outputs
<verbatim raw outputs, artifact references, redacted-category notes, or explicit omission reason>

## Limitations
- <limitation or `None - no known limitations`>

## Deferred
- <deferred item or `None - no deferred items`>
```

## Status Rules

- `completed`: all requested routes ran successfully or every requested externally supplied output passed the fallback status matrix, at least two distinct actual model identities or routing keys produced useful outputs, read-only capability evidence was available for routed runs, the same `input packet id` is recorded for every route or external output, canonical packet evidence was retained, and the requested synthesis mode completed.
- `partial`: at least one useful output exists, but some routes failed, timed out, were blocked, raw outputs were omitted, model identity was uncertain, requested routes collapsed to fewer than two distinct actual model identities or routing keys, canonical packet evidence was unavailable, or requested format-preserving synthesis could not be completed.
- `blocked`: no useful output exists, required fields are missing, or the host cannot run or accept completed outputs.
- `raw-only`: raw output collection succeeded and semantic synthesis was not requested.

## Fallback Status Matrix

- Fixed-model alias agents are `partial` unless alias definitions, route evidence, read-only capability evidence, and canonical packet evidence prove no material wrapper differences.
- User-supplied raw outputs can be `completed` only when every requested output is present, each output has model provenance, the canonical packet evidence matches every output, at least two distinct actual model identities or routing keys are represented, and the raw-output policy is satisfied.
- Partial external outputs are `partial` when at least one useful output exists. No runnable routes and no useful supplied output is `blocked`.

## Raw Output Rules

Raw outputs belong in the report unless one of these is true:

- the user explicitly requested artifact references instead of inline raw output;
- the host provides named artifacts and the report cites them;
- sensitive data requires value redaction;
- hidden prompts, system messages, tool internals, or model-private routing details require category redaction or omission;
- output size forces summarization, in which case include an artifact reference or exact omission limitation.

## Limitations

Always report:

- routes not run;
- model labels not verified by the host;
- read-only capability evidence missing for routed target-agent invocation;
- target agent unavailable or not actually invoked;
- fixed-model alias wrapper differences;
- compatibility gates that failed;
- canonical packet evidence missing or reduced to a digest only;
- duplicate requested labels or routes that collapsed to the same actual model;
- raw-output omissions or redactions;
- synthesis claims that rest on a single model only.