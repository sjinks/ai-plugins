# Interactive Clarification Reference

This reference defines the one-question-at-a-time clarification protocol for planning agents. It is a local reference, not an invocable skill.

Use it when the user explicitly asks for an interview, grilling session, design-tree walkthrough, one-question-at-a-time planning, or similar interactive clarification before a final planning artifact.

## Goals

- Reach shared understanding before writing the final specification or plan.
- Challenge vague language, hidden assumptions, and overloaded domain terms.
- Prefer repository evidence over asking questions the code or docs can answer.
- Resolve decisions in dependency order so later questions do not rest on unstable assumptions.
- Capture only decisions that affect scope, requirements, interfaces, task boundaries, verification, reversibility, or risk.

## Activation Rules

- Use this protocol only when the current user explicitly asks for interactive clarification.
- If the user asks for both interactive clarification and an immediate deliverable, ask the single highest-leverage question first unless they explicitly say to skip questions.
- If the user later asks to stop the interview, stop and produce the best available artifact with remaining uncertainty in Assumptions or Open Questions.
- Do not use this protocol for ordinary planning requests. For ordinary requests, ask at most one blocking question only when needed.

## Evidence Before Questions

Before asking, inspect narrow context when it can answer the question:

- Existing repository docs, glossary-like files, ADRs, README sections, tests, schemas, public interfaces, or examples.
- Existing code behavior when the user makes a claim about how the system works.
- Already available notes or prior planning artifacts when they are in scope.

Do not ask the user to restate information that is already clear from current context. Do not inspect broad repository context merely to avoid asking; keep the search targeted to the decision being clarified.

## Question Selection

Ask exactly one question per turn. Choose the question that most reduces implementation risk or prevents downstream rework.

Prefer questions about:

- Product behavior that would change FRs, NFRs, ACs, interfaces, task boundaries, sequencing, or verification.
- Domain terms whose meaning is overloaded, inconsistent, or contradicted by repository evidence.
- Actor, permission, data ownership, lifecycle, state, failure, compatibility, migration, or observability boundaries.
- Tradeoffs that are hard to reverse, surprising without context, or likely to affect future maintainers.

Avoid questions about:

- Pure implementation details that a builder can discover safely later.
- Preferences that do not change behavior, interfaces, verification, or risk.
- Secrets, credentials, PII, production identifiers, raw customer data, private keys, auth headers, or sensitive payloads.

## Question Format

Each question should include:

- The question in one concise sentence.
- Why it matters for scope, requirements, interfaces, sequencing, verification, or risk.
- A recommended default answer when a conservative default is available.
- Relevant evidence from docs, code, or prior context when available.

Ask for redacted examples, synthetic placeholders, or high-level constraints instead of sensitive values.

## Domain-Language Pressure

- When a user uses a term that conflicts with repository language, call out the conflict and ask which meaning is intended.
- When a term is vague or overloaded, propose a precise canonical term and ask the user to confirm or correct it.
- Distinguish glossary/domain concepts from implementation details. A domain term should describe business meaning, not a class name or storage choice unless the repository already treats it that way.

## Scenario Pressure

Use concrete scenarios to test fuzzy decisions. Scenarios should be small, realistic, and aimed at boundaries:

- Valid vs invalid input.
- Permission allowed vs denied.
- Empty, missing, duplicate, stale, concurrent, or out-of-order data.
- Partial failure, retry, cancellation, rollback, timeout, or cleanup.
- Backward compatibility, migration, or unknown future fields.

Do not invent broad product scope through scenarios. Use them to clarify the requested behavior.

## Evidence Conflicts

When user statements conflict with repository evidence:

- State the conflict briefly.
- Ask which source should govern the planning artifact.
- Record the chosen resolution as an assumption, requirement, open question, or scope amendment according to the active agent's format.

## Decision Documentation

Do not create or update docs from this reference by default. Planning agents should use their normal persistence workflow.

Offer to document a decision only when all are true:

- The decision is meaningful to future readers.
- Reversing it later would be costly.
- The choice is surprising without context.
- There was a real tradeoff among plausible alternatives.

If those conditions are not met, keep the decision in the planning artifact instead of creating extra documentation.

## Stop Conditions

Stop interviewing and produce the planning artifact when:

- Remaining uncertainty would not change in-scope behavior, interfaces, task boundaries, sequencing, verification, or readiness.
- The user accepts a recommended default.
- The user asks to stop, skip questions, or produce a best-effort artifact.
- The next question would request sensitive information.

Route unresolved consequential uncertainty to Open Questions. Route modest, non-consequential defaults to Assumptions.

## Anti-Patterns

- Do not ask a questionnaire or multiple questions in one turn.
- Do not use the interview to expand scope beyond the current request.
- Do not ask questions that repository context can answer more reliably.
- Do not bury a consequential decision in an assumption.
- Do not create documentation or files unless the user or active workflow explicitly requests persistence.
- Do not continue interviewing after the remaining uncertainty no longer affects implementation readiness.