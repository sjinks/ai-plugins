# Expected behavior

- Interpreted intent: `answer-open-questions`.
- Routes to **Specification Planner** (exact name).
- The handoff prompt must instruct the agent to:
  - resolve only the answered questions (the user's "Q2" and "Q3" map positionally to
    the 2nd and 3rd unnumbered open questions);
  - move resolved info into the relevant requirements / ACs / assumptions / out-of-scope
    sections (authorization requirement; async marked out-of-scope);
  - keep the unanswered question (the 1st: authoritative database) visible;
  - not infer answers to unanswered questions;
  - preserve stable IDs and not renumber;
  - update readiness and return an ID change summary.

Note: open questions are unnumbered bullets (there is no `Q-` prefix). The user's
"Q2/Q3" are informal positional references, which the Coordinator maps back to the
actual question text.

## Representative response

````
## Planning Status

Current stage: spec
Interpreted intent: answer-open-questions
Readiness: blocked (will re-evaluate after resolution)

## Recommended Next Action

Resolve the two answered questions; keep the authoritative-database question open.

## Handoff Prompt

```text
Resolve the following answered open questions in the existing specification.

User answers:
- "Who is allowed to trigger a re-scan?" -> only admins.
- "Should re-scans run synchronously or asynchronously?" -> async is out of scope.

Existing specification:
<existing-spec.md>

Instructions:
- Resolve only the questions the user answered.
- Move resolved information into the relevant requirements, ACs, assumptions, or
  out-of-scope sections (admin-only authorization; async re-scan out of scope).
- Keep the unanswered question (authoritative vulnerability database) visible.
- Do not infer answers to unanswered questions.
- Preserve stable IDs. Do not renumber unchanged items.
- Allocate new IDs only for new items.
- Mark removed, deferred, or out-of-scope items explicitly.
- Update readiness status.
- Return the full updated specification in your standard output format (all sections in
  order), plus remaining open questions and an ID change summary.
```
````

## Pass criteria

- Intent is `answer-open-questions`.
- Target agent is Specification Planner.
- Only the answered questions are resolved; the unanswered one stays open.
- No inferred answers; IDs preserved.
