# Exploration Protocol Reference

This reference defines the cross-cutting rules for all Code Explorer phases. It is a local reference, not an invocable skill. Every phase skill and the orchestrator agent must follow these rules.

## Evidence Rules

Do not invent architecture, behavior, or intent. Every important claim must be grounded in evidence from one or more of: source code, tests, configuration files, build scripts, documentation, CI workflows, schemas, generated API specs, dependency manifests, commit history, or runtime output from tests or static analysis.

Cite evidence in this style:

```text
Evidence:
- `src/foo/bar.ts` defines `processRequest()`.
- `src/foo/bar.test.ts` covers invalid input.
- `.github/workflows/test.yml` runs `npm test`.
```

When referencing source files, include paths and symbols:

```text
- `src/path/to/file.ts`: `ClassName.methodName()`
```

## Confidence Levels

Every major conclusion must carry a confidence level:

- `High` — directly supported by code/tests/config.
- `Medium` — strongly suggested by multiple signals, but not directly confirmed.
- `Low` — plausible, but needs human verification.

Markdown artifacts use these capitalized labels. JSON enums use the lowercase values defined in `shared/output-contracts.md` (`low|medium|high`).

## Inference Labels

Separate what you know from what you guess. Use explicit labels:

```text
Confirmed:
- ...

Inferred:
- ...

Speculative:
- ...
```

Prefer writing an open question over inventing an answer. Unknown callers/callees/values are recorded as `unknown`, never fabricated.

## Risk Labels

Do not mark something as high risk only because it looks complex. A recorded risk requires all of:

- plausible impact;
- evidence;
- affected area;
- suggested verification.

Severity scale (shared by entrypoints, flows, and the risk register):

- `Critical` — likely severe production/security impact.
- `High` — important and should be addressed soon.
- `Medium` — meaningful but not urgent.
- `Low` — minor or informational.

Markdown artifacts use these capitalized labels. JSON enums use lowercase (`low|medium|high|critical`).

## Prioritization Rules

Do not document everything equally. Prioritize: entrypoints; public APIs; exported functions/classes; business-critical flows; security-sensitive code; database/file/network side effects; concurrency/async boundaries; error handling; validation/authentication/authorization; configuration and feature flags; complex or high fan-in/high fan-out modules; code that tests exercise heavily; code that tests do not exercise but appears important.

Do not produce long summaries for obvious wrappers or boilerplate. Index them only.

Do not deeply analyze generated, vendored, or build-output code unless it is directly relevant. Record those paths in the ignore list during cartography and respect the list in every later phase.

Tests are evidence of intended behavior, but not proof of correctness. When tests and implementation disagree, record the discrepancy as a finding, not as truth for either side.

## Budget Rules

Defaults for keeping the exploration bounded. The user may override any of them.

- Tier 1 deep symbol analysis: at most 40 symbols (tiers are defined in the `symbol-inventory` skill). Select by risk and fan-in/fan-out, not by file order.
- Full entrypoint traces: at most 10 entrypoints, selected by risk. List all remaining entrypoints in the summary table without deep traces.
- Full data-flow traces: at most 5 flows, selected by risk and business importance. If the repository has fewer meaningful flows or entrypoints than a budget allows, trace what exists and note the count under `Limitations`; budgets are caps, not quotas.
- If the repository contains more than roughly 5,000 source files after exclusions, stop and propose a narrowed scope (subdirectory, package, or service) before starting entrypoint tracing.
- When a budget forces sampling, record the sampling decision and what was skipped under `Limitations` in the affected artifact.

## Safety Rules

- Read-only inspection commands (listing, searching, reading files, `git log`, `git status`) are always allowed.
- Never install dependencies. If a useful tool is missing, document the limitation instead, unless the user explicitly approves the exact install command.
- Run builds or tests only when the environment is already configured and the user has approved running them (a single up-front approval for the session is enough).
- Never modify source code, configuration, or anything outside the exploration output directory.
- Never run git commands that mutate state (commit, checkout, reset, clean, stash).
- Ask before creating the output directory the first time; it mutates the user's working tree.
- If a command would be unsafe, destructive, slow, or network-dependent, skip it and record the limitation.

## Provenance Stamp

Every artifact must carry provenance so refreshes are meaningful.

Markdown artifacts start with:

```text
> Generated by Code Explorer on <ISO-8601 date> at commit `<short SHA or "unknown">`. Scope: <repo root or subpath>. Mode: <full | refresh>.
```

JSON artifacts include a `_meta` object:

```json
{
  "_meta": {
    "schemaVersion": 1,
    "generatedAt": "",
    "commit": "",
    "scope": "",
    "mode": "full"
  }
}
```

## Working Tree Changes Mid-Exploration

If the working tree changes while exploration is running (new uncommitted edits appear or disappear), do not analyze the moving target. Keep the stamped commit as the reference for all claims, record the observed change as a risk or open question with what you saw and when, and update any artifact sections that described the earlier state. Never modify or revert the changed files.

## Refresh Mode

If the output directory already exists:

1. Read the existing artifacts before regenerating anything.
2. Preserve human-added content: answered open questions, manual annotations, and any section marked `<!-- manual -->`.
3. Regenerate only artifacts whose subject matter changed, or those the user asked to refresh; update provenance stamps on everything touched. To determine what changed, diff the stamped commit against the current one (`git diff --stat <stamped-commit>..HEAD`) and match the changed paths to each artifact's subject. If this cannot be determined, ask the user.
4. Record what was preserved versus regenerated in the executive summary.

## Output Style

- Prefer tables, Mermaid diagrams, JSON indexes, bullet lists, and traceable file references over prose.
- Keep each artifact small and independently regenerable.
- When a template in `shared/output-contracts.md` exists for the artifact, follow it exactly so refreshes stay diffable.
