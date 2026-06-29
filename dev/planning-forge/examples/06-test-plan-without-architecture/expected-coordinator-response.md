# Expected behavior

- Interpreted intent: `test-plan-request`.
- A specification exists but no architecture artifact is available.
- Routes to **Test Planner** (exact name) for a specification-level test plan.
- The handoff prompt must:
  - trace test cases with typed graph edges over AC/RULE/FR/NFR/INT/EDGE IDs;
  - mark architecture-dependent tests as coverage gaps;
  - not invent architecture or new requirements.

## Representative response

````
## Planning Status

Current stage: test-plan
Interpreted intent: test-plan-request
Readiness: spec ready, architecture missing

## Recommended Next Action

Create a specification-level test plan and flag architecture-dependent coverage gaps.

## Handoff Prompt

```text
Create a specification-level test plan from the task specification.

Specification:
<specification.md>

Instructions:
- Trace test cases with typed graph edges over AC/RULE/FR/NFR/INT/EDGE IDs.
- Mark architecture-dependent tests as coverage gaps.
- Do not invent architecture. Do not invent new requirements.
```
````

## Pass criteria

- Intent is `test-plan-request`.
- Routes to Test Planner.
- Produces a spec-level plan and marks architecture-dependent gaps.
- No invented architecture or requirements.
