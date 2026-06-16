# Finding And Report Contract Reference

This reference defines Review Forge finding and report formats. It is a local reference, not an invocable skill.

## Finding Format

Every finding must include:

- `id`: `RF-<lens>-<number>` scoped to the current report.
- `lens`: contextual, independent, security, performance, adversarial, or test-adequacy.
- `severity`: `blocker | high | medium | low | info`.
- `title`: concise issue title.
- `evidence anchor`: file+hunk/line, redacted diff excerpt, artifact section, or explicit limitation. For sensitive material, use path/line plus a redacted category, never raw values.
- `risk category`: correctness, security, performance, test-adequacy, maintainability, compatibility, data-integrity, reliability, privacy, or other.
- `risk`: why this matters.
- `expected fix`: concrete requested change.
- `acceptance condition`: how the reviewer can close the finding.
- `trace IDs`: upstream IDs when available, or `None`.
- `confidence`: `high | medium | low`.
- `residual risk`: remaining risk after the expected fix, or `None`.
- `fingerprint`: stable local key from normalized lens + canonical path/symbol or hunk context + risk category + normalized title/risk summary. If two findings collide, append a short disambiguator and list the collision in notes.
- `status`: `open | accepted-risk | superseded | resolved-in-diff`.

Do not emit findings without evidence. If evidence is absent, report a limitation or open question instead.

## Severity And Finding Status

- `blocker`: must not merge; severe correctness, security, data-loss, availability, compliance, or release-blocking failure.
- `high`: likely serious user-visible, security, data-integrity, or operational regression.
- `medium`: material correctness, maintainability, testing, performance, or risk issue that should be fixed before normal merge unless accepted.
- `low`: minor issue with low behavioral risk.
- `info`: non-blocking observation.

All findings are `open` unless the reviewed diff already contains evidence satisfying the acceptance condition, or a named owner explicitly accepts the risk. The Coordinator may not downgrade severity during synthesis; if lenses disagree, keep the highest severity and record the conflict.

## Lens Report

Each specialist returns:

```markdown
## Lens Status
`completed | partial | blocked` - <rationale>

## Dimensions Reviewed
- <dimension and coverage>

## Findings
- <RF finding or `None - no findings in reviewed scope`>

## Limitations
- <limitation or `None - no known limitations`>

## Deferred
- <deferred item or `None - no deferred items`>
```

## Synthesized Report

The Coordinator returns:

```markdown
## Review Status
`go | go-with-risks | no-go | inconclusive` - <rationale>

## Inputs
- <target, diff source, artifacts, missing context>

## Lenses Run
- <lens status and coverage>

## Findings
- Include every specialist finding, preserving original ID, lens, severity, evidence, expected fix, acceptance condition, confidence, residual risk, fingerprint, and status. Order by severity (`blocker`, `high`, `medium`, `low`, `info`), then lens order (contextual, independent, security, performance, adversarial, test-adequacy), then original specialist order.

## Cross-Lens Conflicts
- <conflict or `None - no conflicts`>

## Recommendation
- <go/no-go rationale and required next action>

## Limitations
- <limitation or `None - no known limitations`>

## Residual Risk
- <risk or `None - no known residual risk`>

## Deferred
- Posting comments, resolving threads, editing code, committing, pushing, and deploying are out of scope for Review Forge v1.
```

## Recommendation Rules

- `no-go` for any `blocker`, open `high` finding, missing diff, compromised independent isolation, or blocked required lens.
- `go-with-risks` when open medium/low findings, info findings, accepted risks, or explicit residual risks remain.
- `go` only when all requested lenses complete with no open findings above `info`, no accepted risks, and no material limitations or residual risk.
- `inconclusive` when evidence is insufficient for a recommendation but not clearly `no-go`.
