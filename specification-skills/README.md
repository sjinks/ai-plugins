# specification-skills

A plugin that ships a set of requirements and specification workflow skills for AI agents. Each skill targets a specific failure mode that surfaces after coding has started: unverifiable acceptance criteria, ambiguous requirements, undefined scope, hidden assumptions, missed edge cases, mid-build spec surprises, and monolithic work items that cannot be verified independently.

The skills are not hooks and do not intercept anything. They load by description-trigger matching: when the agent works on a requirements or specification task, the matching skill's vocabulary triggers and its checklist is loaded into context. Each skill is also user-invocable as a slash command.

## What ships

- `skills/acceptance-criteria-quality/` — write, rewrite, or audit acceptance criteria against a five-property contract (testable, observable, single, scoped, implementation-neutral) plus a five-category coverage check, so each criterion can be objectively verified before work starts.
- `skills/requirements-ambiguity-audit/` — audit draft specs, requirements, and user stories for ambiguity across eight classes (vague quantifiers, undefined terms, missing actors, conflicting requirements, placeholders, unspecified paths, ambiguous references, untestable wording) with quotes, plausible readings, and proposed rewrites.
- `skills/requirement-sharpening/` — make requirements buildable and decidable rather than merely well-formed: replace vague quality words with a measured threshold plus a named measurement method, eliminate requirements that defer their own behavior, decouple requirements from named files or symbols, make MUST/SHOULD/MAY rankings discriminate, add a completeness matrix against a leaned-on standard, and assert bidirectional traceability as a mechanical gate.
- `skills/scope-boundary-definition/` — make a work item's boundaries explicit before planning: in-scope, out-of-scope, non-goal, and deferred lists, a smallest valuable slice, surfaced boundary decisions, and scope-creep risks with pre-empting boundary statements.
- `skills/assumption-surfacing/` — sweep a spec, plan, design, or estimate for implicit assumptions across data, ordering, scale, auth-context, environment, compatibility, dependency-behavior, and people-process categories, classifying each as verify-before-build or accept-with-risk.
- `skills/spec-edge-case-enumeration/` — sweep a feature spec across eight edge-case dimensions (empty/boundary, error paths, permissions, concurrency, time, locale and text, limits, lifecycle) and separate spec decisions from implementation details and deep-review flags.
- `skills/artifact-consolidation/` — merge several same-kind planning artifacts (multiple specs, architectures, or test plans) into one without losing or renumbering stable IDs: namespace colliding IDs by concern, de-duplicate sections, build a single open-questions ledger, and mark superseded sources for removal.
- `skills/doc-source-reconciliation/` — verify a doc that claims to reflect the current implementation actually matches it: reconcile file extensions, target/example names, dependency lists, public type/option/enumerator names, behavioral defaults, and volatile counts against the live tree before the doc is trusted or merged.

## Slash commands

After installation, each skill is invocable on demand:

```
/acceptance-criteria-quality
/requirements-ambiguity-audit
/requirement-sharpening
/scope-boundary-definition
/assumption-surfacing
/spec-edge-case-enumeration
/artifact-consolidation
/doc-source-reconciliation
```

## Where each skill fits

| Stage | Skill |
|---|---|
| Drafting requirements | `requirements-ambiguity-audit`, `acceptance-criteria-quality`, `requirement-sharpening` |
| Bounding the work | `scope-boundary-definition`, `assumption-surfacing` |
| Stress-testing the spec | `spec-edge-case-enumeration` |
| Maintaining specs over time | `artifact-consolidation`, `doc-source-reconciliation` |

## Scope

- Documentation + checklist skills only. No hooks. No execution interception.
- Skills load when their description vocabulary matches, and can be invoked explicitly as slash commands.
