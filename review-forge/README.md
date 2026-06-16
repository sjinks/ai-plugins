# review-forge

Review Forge is a read-only multi-lens review workflow plugin. It reviews diffs and changed files through focused lenses, then returns actionable findings and a synthesized quality-gate report.

It does not edit code, post PR comments, resolve threads, mutate git, deploy, install dependencies, or depend on external skills. Optional host-provided skills may be used only as advisory data.

## What ships

- `agents/review-forge-coordinator.agent.md` — default multi-lens entrypoint and synthesis agent.
- `agents/contextual-reviewer.agent.md` — full-context correctness and maintainability review.
- `agents/independent-reviewer.agent.md` — minimal-context bias-check review.
- `agents/security-reviewer.agent.md` — security and privacy review.
- `agents/performance-reviewer.agent.md` — performance and scalability review.
- `agents/adversarial-reviewer.agent.md` — aggressive edge-case and failure-mode review.
- `agents/test-adequacy-reviewer.agent.md` — test and verification coverage review.
- `shared/` — local references for input normalization, finding/report format, read-only safety, independent isolation, advisory skills, single-pass review, and lens summaries.

## Inputs

Review Forge can use:

- raw unified diffs;
- local working tree, staged changes, branches, ranges, or changed-file lists;
- supplied PR context with diff/content;
- Planning Forge artifacts;
- Code Smith completion reports;
- Test Smith verification reports;
- Code Explorer artifacts.

A PR URL alone is not enough review context unless a tool or user supplies the diff/content.

## Workflow

1. Normalize review inputs and missing context.
2. Select requested lenses or default applicable lenses.
3. Build scoped specialist packets.
4. Preserve independent-review isolation.
5. Run specialist reviewers.
6. Synthesize findings, conflicts, limitations, residual risk, and a recommendation.

## Findings

Findings use report-local IDs (`RF-<lens>-<number>`) and include severity, evidence anchor, risk, expected fix, acceptance condition, trace IDs, confidence, and residual risk. Findings without evidence are not emitted.

## Recommendation

The synthesized report uses one status:

- `go`
- `go-with-risks`
- `no-go`
- `inconclusive`

A missing diff, blocked required lens, compromised independent isolation, or unresolved blocker/high finding prevents clean `go`.

## Scope

- Read-only review reports only.
- No edits, comments, PR thread resolution, commits, pushes, branch changes, deploys, package publishing, or dependency installs.
- No raw secrets, credentials, tokens, PII, customer data, or production identifiers in reports.
- No hard dependency on `review-skills` or any other plugin.

## Development Fixtures

Manual-review fixtures live under `dev/review-forge/examples/`. They are static anchors, not model-evaluation tests. A lightweight lint validates required files, known agents, forbidden tools, balanced fences, and key contract anchors:

```bash
node dev/review-forge/scripts/lint-review-forge.mjs
```
