# Verification Report Reference

This reference defines Test Smith's required report. It is a local reference, not an invocable skill.

Return every section in order. Use `None - <reason>` for empty sections.

## Status Rules

Use exactly one status:

- `verified` — every required in-scope check ran or was validly reviewed and passed.
- `failed` — at least one required in-scope automated, static, manual, or review check ran or completed with failing evidence.
- `partial` — at least one required check passed, but another required or requested check was skipped, blocked, inconclusive, unavailable, or manually unresolved.
- `blocked` — no meaningful required verification could proceed.

Never use `verified` for a check that did not run, was denied approval, lacked evidence, or was only assumed.

## Result Item Shape

Each result in `## Results` should include these fields in compact prose:

- `label`: prose check name or preserved `TC-`/command name.
- `source`: Planning Forge Test Plan, Code Smith report, raw instructions, ad-hoc request, or repository discovery.
- `trace`: existing `TC-`, `AC-`, `FR-`, `NFR-`, `D-`, `EDGE-`, and `INT-` IDs when available.
- `mode`: `command | static | manual | review`.
- `command`: restated resolved command, or `None`.
- `classification`: `trivially-safe | approval-bound | forbidden | unknown`.
- `outcome`: `passed | failed | skipped | blocked | inconclusive`.
- `evidence`: concise redacted evidence summary.
- `notes`: limitations, approval decision, manual rationale, or residual risk.

## Required Report

```markdown
## Verification Status
`verified | partial | failed | blocked` - <one-sentence rationale>

## Inputs
- <source, IDs, constraints, absent fields>

## Command Safety Decisions
- <command/check> - <classification and approval/refusal/blocked note>

## Results
- <label> - outcome: <passed | failed | skipped | blocked | inconclusive>; source: <source>; trace: <IDs or None>; mode: <command | static | manual | review>; command: <restated command or None>; classification: <trivially-safe | approval-bound | forbidden | unknown>; evidence: <redacted summary>; notes: <limitations or residual risk>

## Manual Checks
- <manual/review check status or None>

## Failures / Unmet ACs
- <failed required check, unmet AC, or None>

## Skipped / Blocked Checks
- <skipped/blocked/inconclusive required or requested checks, or None>

## Residual Risk
- <remaining verification risk or None>

## Limitations
- <missing tooling, missing inputs, redactions, unavailable refs, or None>

## Reserved Handoff Surface
- Review Smith / Orchestrator may consume this report later; no invocation was performed.

## Deferred
- Test edits, code fixes, commits, pushes, pull requests, and deploys are out of scope for Test Smith v1.
```
