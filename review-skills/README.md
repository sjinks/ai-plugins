# review-skills

A plugin that ships a set of code-review workflow skills for AI agents. Each skill targets a specific failure mode that turns a single review into a multi-round cycle: oversized PRs, low-hygiene changes, incremental reviews, single-lens blind spots, vague findings, unpropagated defect classes, stalled disagreements, symptom-only fixes, regression-prone patches, and superficial thread closure.

The skills are not hooks and do not intercept anything. They load by description-trigger matching: when the agent works on a review-related task, the matching skill's vocabulary triggers and its checklist is loaded into context. Each skill is also user-invocable as a slash command.

## What ships

- `skills/pr-scope-slicer/` — decide whether a change set can be reviewed well in one pass; when it cannot, produce an ordered slice plan where each slice is independently reviewable.
- `skills/pre-review-self-audit/` — audit your own change against the checks a reviewer will apply, before requesting review, to remove the predictable first review round.
- `skills/single-pass-review-completeness/` — structure one review round so it is complete by construction: enumerate dimensions up front, sweep the whole diff per dimension, and declare coverage.
- `skills/multi-lens-review/` — walk a non-trivial change through intent, design, implementation, security, adversarial, and verification lenses, then synthesize the findings into one decision with required actions and residual risk.
- `skills/review-finding-quality/` — enforce a quality contract on findings (severity, evidence anchor, expected fix, acceptance condition) so each one is actionable and closable in one round.
- `skills/equivalence-class-audit/` — turn one confirmed defect into a locked-scope audit for equivalent defects across sibling fields, mirror use sites, bounds, contracts, paths, modes, tests, and docs.
- `skills/review-disagreement-resolution/` — resolve a stalled reviewer/author dispute by classifying it as fact, standard, or preference, anchoring it to a source, and applying a decision rule.
- `skills/fix-batching-and-root-cause/` — plan a fix batch so the next review round is the last: cluster findings by shared root cause, fix the cause once, and label each fix's depth honestly.
- `skills/fix-blast-radius/` — before a fix is pushed, identify what it could newly break and which resolved findings it could regress, with one verification step per risk.
- `skills/review-cycle-gatekeeper/` — enforce closure quality across iterative rounds, verify findings are closed with evidence, audit unresolved threads, and produce a go/no-go pre-merge gate decision.

## Slash commands

After installation, each skill is invocable on demand:

```
/pr-scope-slicer
/pre-review-self-audit
/single-pass-review-completeness
/multi-lens-review
/review-finding-quality
/equivalence-class-audit
/review-disagreement-resolution
/fix-batching-and-root-cause
/fix-blast-radius
/review-cycle-gatekeeper
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

- Documentation + checklist skills only. No hooks. No execution interception.
- Skills load when their description vocabulary matches, and can be invoked explicitly as slash commands.
