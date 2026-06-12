---
name: test-coverage-map
description: "Use when: mapping tests to behavior during deep codebase exploration: test inventory, semantic behavior coverage, important coverage gaps for high-risk flows, fixtures and mocks, skipped/flaky tests. Phase 9 of the Code Explorer workflow."
argument-hint: "Repository scope; entrypoints, flows, and symbol inventory if available; whether running tests is approved."
user-invocable: true
---

# Test Coverage and Behavior Map

Map tests to behavior, not only to files. This is a semantic coverage map: line coverage is one input, never the conclusion. Phase 9 of the Code Explorer workflow; the entrypoints (Phase 4), flows (Phase 6), and Tier 1 symbols (Phase 7) define which behaviors matter.

Follow the evidence and safety rules in the plugin's `shared/exploration-protocol.md`. Output contracts: `09_TEST_COVERAGE_MAP.md` and `test_map.json` in `shared/output-contracts.md`. Both reference files (`shared/exploration-protocol.md` and `shared/output-contracts.md`) live at the plugin root, sibling of `skills/`; output artifacts go under the explored repository's `docs/codebase-exploration/`. When run standalone, those rules still apply; if either reference is unavailable, stop and report it.

## Tasks

1. Identify the test frameworks and test setup (config, helpers, global fixtures).
2. Inventory test files and classify each: unit, integration, e2e, other; and the area it targets.
3. Map tests to behaviors: read test names and assertions, not just file paths. "Tests exist for module X" is not behavior coverage.
4. Identify important behavior that is covered, with the specific test as evidence.
5. Identify important behavior that is not obviously covered. Cross-check against: traced entrypoints, traced flows, Tier 1 symbols, and High/Critical candidate risks. When those artifacts are absent (standalone use), judge importance from visible entrypoints and public APIs and note the weaker basis under `Limitations`. Each gap gets a risk level and a suggested test. Example gap row: `| Refund flow has no failure-path test | payments | High | Integration test: refund with gateway timeout |`.
6. Identify fixtures and mocks; note mocks that replace security-relevant behavior (auth, validation) since they can hide gaps.
7. Identify skipped, disabled, or flaky-marked tests with locations.
8. Run the test suite only with session-level approval and an already-configured environment. Record results (pass/fail counts, failures) under `Test command results`. Use coverage tooling only if already configured.

## Rules

- Tests are evidence of intended behavior, not proof of correctness. When a test asserts behavior that contradicts the implementation or docs, record the discrepancy as a finding.
- A behavior is `High` confidence covered only when you read an assertion that exercises it. Test-file existence gives at most `Low`.
- Gaps are prioritized by risk: an untested high-risk entrypoint outranks an untested utility. Do not list every uncovered trivial helper.
- A failing or skipped test guarding a high-risk behavior is itself a gap.

## Output

Write `09_TEST_COVERAGE_MAP.md` and `machine-readable/test_map.json` per `shared/output-contracts.md`, with provenance stamps. High-risk gaps forward to the risk register (Phase 10).
