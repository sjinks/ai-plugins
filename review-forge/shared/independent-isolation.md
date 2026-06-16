# Independent Review Isolation Reference

This reference defines how the Independent Reviewer stays unbiased. It is a local reference, not an invocable skill.

## Core Rule

Independent review receives only the diff, changed paths, and minimal directly relevant surrounding code needed to understand the diff. It must not receive author rationale, architecture decisions, specifications, Code Smith reports, Test Smith reports, Code Explorer artifacts, or other lens findings.

## Allowed Context

- Raw diff or changed hunks.
- Changed file paths.
- Minimal surrounding code from changed files or direct call sites when needed to understand behavior.
- Build/test file names only when they are directly changed or referenced in the diff.

## Forbidden Context

- Product/spec/architecture rationale.
- Planning Forge artifacts.
- Code Smith or Test Smith reports.
- Code Explorer analysis.
- Review findings from other lenses.
- Reviewer discussion or PR comments that explain intent.

## If Isolation Is Compromised

If disallowed context is supplied to the Independent Reviewer, mark the independent lens `blocked` or `partial` due to compromised isolation. Do not emit a clean independent verdict.

## Coordinator Handoff Rule

The Coordinator must construct a separate independent-review packet before invoking the Independent Reviewer, and must not append context intended for contextual/security/performance/adversarial lenses.
