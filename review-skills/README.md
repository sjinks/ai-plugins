# review-skills

A plugin that ships code-review workflow skills for AI agents. The skills cover PR scope, pre-review checks, review coverage, finding quality, equivalent defects, disagreements, fix planning, regression risks, and merge-readiness assessment.

The skills are not hooks and do not intercept anything. Their descriptions state when each skill applies; a compatible host can use those descriptions for discovery.

## What ships

- `skills/pr-scope-slicer/` — decide whether a change set can be reviewed well in one pass; when it cannot, produce an ordered slice plan where each slice is independently reviewable.
- `skills/pre-review-self-audit/` — audit your own change against the checks a reviewer will apply, before requesting review, to remove the predictable first review round.
- `skills/single-pass-review-completeness/` — structure one review round so it is complete by construction: enumerate dimensions up front, sweep the whole diff per dimension, and declare coverage.
- `skills/multi-lens-review/` — walk a non-trivial change through intent, design, implementation, security, adversarial, and verification lenses, then synthesize the findings into one decision with required actions and residual risk.
- `skills/review-finding-quality/` — enforce a quality contract on findings (severity, evidence anchor, expected fix, acceptance condition) so each one is actionable and closable in one round.
- `skills/equivalence-class-audit/` — turn one confirmed defect into a locked-scope audit for equivalent defects across sibling fields, mirror use sites, bounds, contracts, paths, modes, tests, and docs.
- `skills/review-disagreement-resolution/` — resolve a stalled reviewer/author dispute by classifying it as fact, standard, or preference, anchoring it to a source, and applying a decision rule.
- `skills/fix-batching-and-root-cause/` — plan a fix batch by clustering findings with a demonstrated shared cause, proposing changes and verification, and labeling the planned fix depth. It does not implement or verify the fixes.
- `skills/fix-blast-radius/` — before a fix is pushed, identify what it could newly break and which resolved findings it could regress, with one verification step per risk.
- `skills/review-cycle-gatekeeper/` — assess closure quality across review rounds using supplied finding states and verification evidence, audit unresolved threads, and report a pre-merge gate decision.

## Skill names

Use these names to select a skill where the host supports explicit invocation:

```
pr-scope-slicer
pre-review-self-audit
single-pass-review-completeness
multi-lens-review
review-finding-quality
equivalence-class-audit
review-disagreement-resolution
fix-batching-and-root-cause
fix-blast-radius
review-cycle-gatekeeper
```

## Where each skill fits in a review cycle

| Stage | Skill |
|---|---|
| Before opening a PR | `pr-scope-slicer`, `pre-review-self-audit` |
| Performing a review | `single-pass-review-completeness`, `multi-lens-review`, `review-finding-quality` |
| Expanding a confirmed defect | `equivalence-class-audit` |
| Disputed feedback | `review-disagreement-resolution` |
| Planning fixes | `fix-batching-and-root-cause`, `fix-blast-radius` |
| Pre-merge gate | `review-cycle-gatekeeper` |

## Scope

- Skill instructions and references only. No hooks or execution interception.
- Actual discovery and explicit invocation syntax depend on the host.
