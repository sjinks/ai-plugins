# Expected Report Shape

## Lens Status
`blocked` - Independent isolation is compromised if architecture rationale is visible to the Independent Reviewer.

## Dimensions Reviewed
- None - review must not proceed with forbidden context in view.

## Findings
- None - no independent findings emitted because isolation is compromised.

## Limitations
- Forbidden context present: architecture rationale. Coordinator must request a fresh diff-only packet or omit the independent lens.

## Deferred
- Contextual review may use the architecture rationale; independent review may not.
