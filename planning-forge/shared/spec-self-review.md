# Specification Brainstorming Reference

This reference adds lightweight brainstorming and design-shaping checks for the Specification Planner. It is a local reference, not an invocable skill.

Use it when a request is solution-shaped, broad enough to hide multiple projects, or contains meaningful product/design alternatives. Do not require user approval gates or persistence unless the current user explicitly asks for them.

## Oversized Scope Check

- Before refining details, check whether the request describes multiple independent systems, products, workflows, or release outcomes.
- If the work is too broad for one coherent implementation task, decompose it into sub-projects or ordered slices before writing detailed requirements.
- Put blocked or later slices in Open Questions, Out Of Scope, or Implementation Tasks according to readiness.
- Do not spend interview turns polishing details for a scope that first needs decomposition.

## Meaningful Alternatives Check

- When there are real product or technical alternatives, compare 2-3 approaches before settling requirements.
- Lead with the recommended approach and give the reason, accepted tradeoff, and reversibility.
- Skip fake alternatives when the request, repository constraints, or existing architecture already make the path obvious.
- Convert unresolved alternative choices into Open Questions when the answer would change business rules, FRs, NFRs, ACs, interfaces, task boundaries, sequencing, or verification.

## Section-Scale Design Review

- Scale review depth to complexity. Simple tasks may need only a few sentences; broad or risky tasks need explicit sections for scope, actors, data flow, errors, testing, and rollout/migration.
- For user-guided design sessions, validate one section at a time only when the user explicitly asks for collaborative review.
- Do not introduce a mandatory approval gate for ordinary specification requests.

## Anti-Patterns

- Do not force a design approval gate for every task.
- Do not write or commit design documents from this reference.
- Do not invoke implementation planning or builder agents from this reference.
- Do not add alternatives just to satisfy a checklist.
- Do not expand scope while decomposing it.