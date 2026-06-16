# Review Lenses Reference

This reference summarizes the v1 Review Forge lenses. It is a local reference, not an invocable skill.

## Contextual Review

Full-context review. Use supplied requirements, architecture, reports, tests, and repository evidence to check whether the implementation matches intent and preserves maintainability.

## Independent Review

Minimal-context review. Use only diff, changed paths, and directly needed code context. Bias check against author rationale and architecture assumptions.

## Security Review

Review authentication, authorization, input validation, injection, unsafe file/network/shell behavior, secrets, crypto/session/token handling, sensitive logs, dependency/plugin loading, and privacy risks.

## Performance / Scalability Review

Review unbounded work, N+1 patterns, missing pagination, memory growth, blocking I/O, retry storms, cache misuse, startup cost, expensive serialization, and concurrency/backpressure concerns.

## Adversarial Review

Actively look for edge cases, invariant breaks, misuse paths, failure modes, and ways tests/security assumptions could be broken.

## Test Adequacy Review

Review whether tests and verification evidence cover the change, key acceptance criteria, risks, edge cases, and failure modes. Do not execute tests or edit test files.
