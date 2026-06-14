# Expected behavior

- Interpreted intent: `spike-request`.
- The request names a topic ("parser behavior") but **no decision criteria**.
- The Coordinator must **not** route to Prototype Spike yet. Instead it asks for the
  decision criteria or proposes a minimal set, and confirms the specific uncertainty.
- It must not start broad exploratory implementation.

## Representative response

```
## Planning Status

Current stage: spec
Interpreted intent: spike-request
Readiness: unknown (spike gating; readiness not assessed)

## Recommended Next Action

A spike needs a specific uncertainty and decision criteria before it runs. Please
confirm the exact question and how we will judge the result, or accept the proposed
minimal criteria below.

Proposed minimal decision criteria:
- Concrete question: does the parser correctly handle <specific input class>?
- Inputs: a small set of representative and malformed samples.
- Pass: parser returns the expected structure for valid input and a clear error for
  malformed input, with no crash.
- Verdict to return: supports / rejects / inconclusive.

Once you confirm, I will route to Prototype Spike with these criteria.
```

## Pass criteria

- Intent is `spike-request`.
- Does **not** route to Prototype Spike without decision criteria.
- Asks for or proposes minimal decision criteria.
- No broad exploratory implementation.
