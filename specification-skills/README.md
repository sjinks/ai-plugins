# specification-skills

A plugin that ships requirements and specification workflow skills for AI agents. The skills cover acceptance criteria, ambiguity, requirement precision, scope, assumptions, edge cases, artifact consolidation, and reconciliation of documentation with source code.

The skills are not hooks and do not intercept anything. Their descriptions state when each skill applies; a compatible host can use those descriptions for discovery.

## What ships

- `skills/acceptance-criteria-quality/` — write, rewrite, or audit acceptance criteria against a five-property contract (testable, observable, single, scoped, implementation-neutral) plus a five-category coverage check, so each criterion can be objectively verified before work starts.
- `skills/requirements-ambiguity-audit/` — audit draft specs, requirements, and user stories for ambiguity across eight classes (vague quantifiers, undefined terms, missing actors, conflicting requirements, placeholders, unspecified paths, ambiguous references, untestable wording) with quotes, plausible readings, and proposed rewrites.
- `skills/requirement-sharpening/` — make requirements buildable and decidable rather than merely well-formed: replace vague quality words with a measured threshold plus a named measurement method, eliminate requirements that defer their own behavior, decouple requirements from named files or symbols, make MUST/SHOULD/MAY rankings discriminate, add a completeness matrix against a leaned-on standard, and assert bidirectional traceability as a mechanical gate.
- `skills/scope-boundary-definition/` — make a work item's boundaries explicit before planning: in-scope, out-of-scope, non-goal, and deferred lists, a smallest valuable slice, surfaced boundary decisions, and scope-creep risks with pre-empting boundary statements.
- `skills/assumption-surfacing/` — sweep a spec, plan, design, or estimate for implicit assumptions across data, ordering, scale, auth-context, environment, compatibility, dependency-behavior, and people-process categories, classifying each as verify-before-build or accept-with-risk.
- `skills/spec-edge-case-enumeration/` — sweep a feature spec across eight edge-case dimensions (empty/boundary, error paths, permissions, concurrency, time, locale and text, limits, lifecycle) and separate spec decisions from implementation details and deep-review flags.
- `skills/artifact-consolidation/` — merge several same-kind planning artifacts (multiple specs, architectures, or test plans) into one without losing or renumbering stable IDs: preserve the base source IDs, namespace every non-base source in full by concern, de-duplicate sections, build a single open-questions ledger, and mark superseded sources without deleting them.
- `skills/doc-source-reconciliation/` — verify a doc that claims to reflect the current implementation actually matches it: reconcile file extensions, target/example names, dependency lists, public type/option/enumerator names, behavioral defaults, and volatile counts against the live tree before the doc is trusted or merged.

## Skill names

Use these names to select a skill where the host supports explicit invocation:

```
acceptance-criteria-quality
requirements-ambiguity-audit
requirement-sharpening
scope-boundary-definition
assumption-surfacing
spec-edge-case-enumeration
artifact-consolidation
doc-source-reconciliation
```

## Where each skill fits

| Stage | Skill |
|---|---|
| Drafting requirements | `requirements-ambiguity-audit`, `acceptance-criteria-quality`, `requirement-sharpening` |
| Bounding the work | `scope-boundary-definition`, `assumption-surfacing` |
| Stress-testing the spec | `spec-edge-case-enumeration` |
| Maintaining specs over time | `artifact-consolidation`, `doc-source-reconciliation` |

## Scope

- Skill instructions and references only. No hooks or execution interception.
- Actual discovery and explicit invocation syntax depend on the host.
