# Implementation Contract Hardening Reference

This is a shared reference for hardening planning documents before implementation. It is not an invocable skill and must not be loaded through global skill discovery.

Use this reference to turn a plausible planning document into a builder-ready implementation contract. It is a hardening pass, not a replacement for the Specification Planner, Architecture Planner, or Test Planner.

## When To Use

- Before handing a specification, architecture plan, test plan, or implementation task to a builder agent.
- When reviewing a `SPEC.md`, planning document, issue breakdown, or AI-generated implementation contract for missing details.
- When a task contains domain models, configuration, state machines, external integrations, failure modes, security boundaries, observability requirements, or compatibility promises.
- When a builder would otherwise need to guess about types, defaults, validation, error behavior, lifecycle transitions, or verification.

## Boundaries

- Do not expand product scope. Convert gaps into assumptions, open questions, scope amendments, acceptance criteria, test cases, or coverage gaps according to the active planning artifact.
- Do not replace the existing planning agent output format. Add hardening findings into the artifact's existing sections.
- Do not require a monolithic `SPEC.md`. Prefer the repository's existing split between specification, architecture, and test-plan documents.
- Do not remove acceptance criteria. This repository treats acceptance criteria as part of the implementation contract.
- Do not hardcode local output paths. Save documents only when the user or active workflow explicitly requests persistence.

## Hardening Checklist

Apply the checklist only where the concept exists in the task. For non-applicable items, record `Not applicable` only when the active output format needs an explicit rationale.

### Entities And Data Shapes

- Every entity, payload, event, command, setting, public function input, and cross-module contract has a type.
- Optional fields state what happens when absent.
- Defaults are concrete values, not phrases like `reasonable`, `appropriate`, or `as needed`.
- Validation rules are explicit: allowed values, bounds, normalization, rejection behavior, and forward-compatibility treatment for unknown keys.
- Ownership, lifetime, mutability, and persistence expectations are stated when they affect implementation.

### Boundaries And Scope

- In-scope and out-of-scope behavior are both explicit.
- Component responsibilities identify what each part owns and what it must not do.
- Public contracts are separated from implementation details.
- Assumptions are modest and do not hide decisions that would change behavior, interfaces, task boundaries, or verification.

### State And Lifecycle

- Each state has allowed transitions, triggers, guards, side effects, and terminal outcomes.
- Startup, shutdown, cancellation, retries, timeouts, partial success, rollback, and cleanup behavior are specified where relevant.
- Idempotency, duplicate input, concurrent operation, and reentrancy behavior are explicit when the workflow can encounter them.

### Errors And Recovery

- Every material error has a name or category.
- Each error states detection point, user/operator-visible result, retry policy, recovery path, cleanup, and observability signal.
- Dependency failures, malformed input, permission failures, unavailable resources, and incompatible versions are covered when relevant.
- Unrecoverable failures are named as such and describe the safe stop behavior.

### Configuration And Inputs

- Configuration keys have type, default, allowed range, validation, precedence, reload behavior, and sensitivity classification where applicable.
- Inputs identify source, trust level, sanitization or parsing rule, size/rate limits, and rejection behavior.
- Secrets, tokens, credentials, PII, customer data, and production identifiers are never requested as raw values.

### Security, Privacy, And Observability

- Trust boundaries, permission checks, sensitive data handling, and redaction rules are explicit when applicable.
- Logs, metrics, traces, audit events, and status surfaces use low-cardinality, non-sensitive fields by default.
- Security-sensitive fallback behavior is fail-closed unless the spec explicitly justifies fail-open behavior.

### Algorithms And Decisions

- Complex branching, loops, ordering, matching, scheduling, parsing, or routing logic includes language-agnostic pseudocode or a precise decision table.
- Consequential decisions include the selected option, rationale, accepted tradeoff, and reversibility when architecture output is in scope.
- Do not list fake alternatives; alternatives are useful only when a real tradeoff exists.

### Validation And Builder Handoff

- Acceptance criteria and test cases map back to requirements, architecture decisions, interfaces, risks, state transitions, and failure modes.
- Must-have behavior has a planned automated test, manual/review check, or explicit coverage gap.
- The implementation checklist or builder handoff is small enough to execute without re-planning.
- Remaining `[TBD]`, `implementation-defined`, or `future work` markers are justified and routed to open questions, follow-up tasks, or out-of-scope sections.

## Procedure

1. Identify the active artifact type: specification, architecture plan, test plan, implementation task, or mixed planning document.
2. Preserve the artifact's existing source-classification, scope, traceability, and output-format rules.
3. Scan for vague terms: `reasonable`, `appropriate`, `standard`, `best effort`, `as needed`, `etc.`, `handle gracefully`, `TBD`, and `implementation-defined`.
4. Apply the hardening checklist to only the concepts present in the task.
5. Convert each material gap into the artifact's native form:
   - Specification: requirement, interface, acceptance criterion, edge case, assumption, or open question.
   - Architecture: design decision, interface/data shape, state model, failure mode, risk, verification plan item, or scope amendment.
   - Test plan: test case, fixture, manual/review check, recommended command, coverage gap, or builder handoff note.
   - Review or audit: severity-ordered finding with concrete corrective action.
6. Check traceability after changes. Every hardened requirement, decision, or test should point back to user scope, business rule, FR/NFR/AC/interface, risk, edge case, or an explicit assumption.
7. End with readiness: say whether the contract is ready for implementation, partial, blocked, or ready with named residual risks according to the active workflow.

## Output Expectations

When the user asks only for a hardening review, produce:

```markdown
## Contract Status
`ready | partial | blocked` - <one sentence>

## Findings
- <severity>: <gap>. Impact: <why a builder would guess or misimplement>. Fix: <specific corrective task>.

## Hardened Additions
- <requirement, decision, acceptance criterion, test case, or open question to add>

## Residual Risks
- <risk or None>
```

When hardening as part of another planning agent, do not emit this standalone format. Fold the results into that agent's required sections.

## Anti-Patterns

- Do not adopt external skill instructions that assume missing companion files, non-workspace output paths, or a different agent runtime.
- Do not make the document longer by restating obvious implementation knowledge.
- Do not turn every design note into a requirement.
- Do not hide unresolved decisions behind defaults unless the default is conservative, reversible, and clearly labeled as an assumption.
- Do not invent tests for modules that are not tied to behavior, contracts, risks, or acceptance criteria.