# Decision Panel Reference

This reference adds a lightweight multi-perspective review for high-impact architecture decisions. It is a local reference, not an invocable skill.

Use it only for architecture decisions with meaningful tradeoffs, broad blast radius, production-readiness risk, or no obvious correct answer. Do not use it for simple fixes, contained tasks, or routine implementation choices.

## Panel Setup

Before applying the panel, state:

- **Question**: the architecture decision to make in one sentence.
- **Context**: relevant constraints, goals, existing evidence, and source limits.
- **Blast radius**: expected scope of impact.
- **Panel**: the smallest set of perspectives that can change the outcome.

Use only perspectives that add distinct risk, tradeoff, or validation value. Skip any perspective that would only restate another one.

## Blast Radius

Classify the decision before using a panel:

- **Level 1 - Contained**: one module/file, easy to reverse. Usually skip the panel.
- **Level 2 - Local system**: multiple files in one component/service, moderate review risk. Usually skip unless tradeoffs are unusually sharp.
- **Level 3 - Cross-system**: multiple components/services, external APIs, shared contracts, migrations, or operational impact. Use the panel.
- **Level 4 - Business-critical**: user safety, revenue, compliance, privacy, data integrity, or production availability. Use the panel.

Record the blast radius in Risks And Mitigations or Alternatives Considered when it materially affects the design.

## Perspectives

Choose 3-5 relevant perspectives. Do not simulate a large council.

- **Architect**: boundaries, contracts, coupling, reversibility, migration path.
- **Security/privacy**: trust boundaries, permissions, sensitive data, abuse cases, fail-closed behavior.
- **Reliability/SRE**: availability, operability, rollback, observability, dependency failure, load.
- **Developer/maintainer**: simplicity, testability, local ergonomics, implementation risk.
- **Product/strategy**: user value, scope fit, business constraints, rollout impact.

Each perspective should contribute only what that lens uniquely sees. Skip perspectives that add no new risk or tradeoff.

## Conflict Review

Use a conflict table only when real perspectives disagree:

- Concern A vs Concern B.
- Why they conflict.
- Resolution path or missing data.
- Chosen winner and rationale when enough evidence exists.

Limit debate to the smallest useful pass. If conflicts remain unresolved, put them in Open Questions or Scope Amendments Requested.

## Priority Ladder

When concerns conflict, prefer the higher-priority concern:

1. Safety.
2. Correctness.
3. Security/privacy.
4. Reliability/operability.
5. Simplicity/maintainability.
6. Cost.
7. Elegance.

When concerns have equal priority, prefer the option that is simpler and easier to reverse.

## Folding Into Architecture Output

Do not emit a standalone panel report unless the user asks for one. Fold results into the Architecture Planner's normal sections:

- Recommended Design for the chosen path.
- Alternatives Considered for rejected paths and real tradeoffs.
- Risks And Mitigations for blast radius, failure modes, and residual risk.
- Security, Privacy, And Observability for trust and operational concerns.
- Open Questions for unresolved conflicts.

## Anti-Patterns

- Do not use a panel for Level 1-2 work unless the user explicitly asks or the decision is unusually consequential.
- Do not invent disagreement when the evidence points to one obvious path.
- Do not use more perspectives than the decision needs.
- Do not let the panel override the current user request or confirmed specification contract.