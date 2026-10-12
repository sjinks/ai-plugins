# Agent/Skill Readiness Audit

Audit: ai-plugins — plugin model-floor audit rerun

Removal follow-up: Shell Safety was removed after this audit at the user’s request. Its findings are retired below. Original audit counts and validation results describe the earlier snapshot; this follow-up is not a new readiness audit.

## Audit Scope

- Audit date: **2026-10-12**; previous report: 2026-08-27.
- Artifact type: Other — collection of Agent Skills and custom agents.
- Mode: package.
- Status: completed — static inspection and repository checks.
- Snapshot: inspected working-tree files based on `7a395eb28125fa0654f942e9657719f509cdb325`, including existing modified and untracked package files. These results do not describe the committed tree alone. Concurrent edits were observed during the audit; affected findings were rechecked before delivery, but this is not an immutable whole-tree snapshot.
- Target models: GPT-6 Luna, GPT-6 Sol, GPT-6.1 Sol, GPT-6 Astra, Claude Haiku 5.5, Claude Sonnet 5, Claude Sonnet 5.5, Claude Opus 4.8, Claude Opus 5, Claude Opus 5.5, Claude Fable 5, Claude Fable 5.1, Claude Mythos 5.1. These are the current audit skill's declared profile labels, not a verification of provider availability.
- Target runtimes: repository-declared Copilot agents and portable skill packages, plus the five skill packages listed in the Codex catalog. No live host configuration was supplied.
- Files included: all **11 plugins, 51 skills, and 18 agents** listed or reachable from `.github/plugin/marketplace.json`; `.agents/plugins/marketplace.json`; package manifests and READMEs; reachable normative references, examples, templates, schemas, and validation scripts.
- Files excluded: Git internals and unrelated workspace/memory instruction packages. Development fixtures were inspected as verification artifacts, not followed as task instructions.
- Limitations: no audited agent workflow, paid model/API call, cross-model behavioral evaluation, installation, or live host integration was run. Effort/thinking settings, effective context, tool permissions, delegation isolation, and model access remain unverified.

“Successful use” means completing the hardest normal workflow within scope and safety boundaries, gathering required evidence, performing required validation, and following the output contract without inventing essential rules. Model profiles are static heuristics. A stronger model does not repair conflicting mandatory instructions or establish safety enforcement.

The earlier GPT-5.x floors and Claude profile estimates are superseded by this assessment; they are not carried forward as measured or current compatibility results.

## Readiness Ratings

These collection-level ratings reflect material risks; they are not averages of package scores.

| Area | Rating | Main risk |
|---|---:|---|
| Discovery and delegation | 3 | Marketplace/package descriptions still advertise absent skills; Instructions Authoring omits a shipped skill from its package guide |
| Instruction architecture | 3 | Review composition and mode-specific instructions do not consistently share one contract |
| Operational completeness | 3 | Prototype authority ambiguity and mode conflicts |
| Model and runtime portability | 3 | Structural defects persist across models; live enforcement and isolated-agent behavior are unverified |
| Maintainability and evaluability | 3 | Provenance examples drift from schemas; structural checks do not exercise agent decisions |

### Package assessment

| Plugin | Hardest normal path | Static readiness | Model-profile assessment |
|---|---|---|---|
| [architecture-skills](architecture-skills/README.md) | Repository-grounded development-container generation and type-safe design | Needs revision: advertised migration workflow is absent | Bounded skills fit fast-general profiles; full repository synthesis favors strong-general/deep-reasoning profiles |
| [code-explorer](code-explorer/README.md) | Eleven-phase exploration, refresh, and artifact validation | Needs revision: execution-mode conflicts and invalid provenance example | Broad exploration favors strong-general/deep-reasoning or long-horizon profiles; mode defects must be repaired independently of model choice |
| [code-smith](code-smith/README.md) | Approved multi-file implementation, command preflight, and verification | Ready with limitations | Bounded slices fit strong-general profiles; broad implementation favors deep-reasoning/long-horizon profiles; runnable verification and host permissions remain prerequisites |
| [commit-discipline-skills](commit-discipline-skills/README.md) | Safe, bisectable history-rewrite planning | Ready with limitations | Fast-general profiles fit bounded message/description tasks; complex history plans favor strong-general profiles. Skills remain advisory and do not execute rewrites |
| [instructions-authoring](instructions-authoring/README.md) | Package-wide audit or evidence-backed cross-model authoring | Needs revision: package discovery guide is incomplete | Bounded prose checks fit fast-general profiles; cross-file contract analysis favors strong-general/deep-reasoning profiles |
| [model-panel](model-panel/README.md) | Multi-route orchestration, provenance, output comparison, and synthesis | Ready with limitations | Coordinator synthesis favors strong-general profiles; each routed task needs its own suitable profile and host-enforced read-only mode |
| [planning-forge](planning-forge/README.md) | Executable prototype spike and implementation handoff | Needs revision: AUDIT-001 remains open | No reliable floor for the disputed executable path as written; stronger reasoning does not resolve authority ambiguity |
| [review-forge](review-forge/README.md) | Six-lens review and synthesis | Ready with limitations on eligible, isolated inputs | Strong-general profiles fit bounded review; independent review requires an isolated diff-only context. Upstream context in the coordinator conversation blocks that lens and forces `no-go` unless explicitly excluded |
| [review-skills](review-skills/README.md) | Composed multi-lens review through merge gate | Needs revision: AUDIT-003 remains open | Standalone skills can fit bounded profiles; composed readiness has no reliable floor until severity, identity, and verdict handoffs are defined |
| [specification-skills](specification-skills/README.md) | ID-preserving consolidation with live-source reconciliation | Needs revision: metadata and edit-mode inconsistencies | Bounded checks fit fast-general profiles; cross-document synthesis favors strong-general/deep-reasoning profiles; side-effect rules need reconciliation |

“Ready with limitations” describes static instruction readiness within the documented input/runtime boundaries. It does not certify any model or installation. All 11 packages now have root manifests; the earlier summary's unspecified missing-manifest concern is retired. The Codex catalog deliberately lists five skill packages, while the Copilot catalog lists all 11; this difference alone is not a defect.

## Material Findings

Existing `AUDIT-*` IDs are retained for continuity. New findings continue that sequence.

### AUDIT-001: Planning Forge's executable spike needs explicit safety precedence

Severity: **HIGH**
Area: Operational completeness
Status: **Open; narrowed to the executable Prototype Spike path**

Locations: [Prototype Spike](planning-forge/agents/prototype-spike.agent.md), Boundaries / Source Rules / Throwaway And Execute Rules (lines 28–40 and 71–80); [UI branch](planning-forge/shared/prototype-spike.md), lines 49–58.

Evidence: source priority starts with “current user request > supplied spec/architecture context”; command execution is allowed for “local, scoped, understood commands”; UI guidance says “Keep real data fetching and read paths when safe.” Separate boundaries forbid sensitive/production data and require exact approval for installs, services, and network commands.

Risk: unlike Review Forge's explicit safety-first precedence, this executable path leaves the relationship between source priority, hard boundaries, and branch guidance implicit. A requested repository script or realistic UI read can have network or sensitive-data effects that its label does not reveal. General safety language helps, but the package does not define the preflight and fail-closed outcome needed to resolve that case consistently. This is a static authority/preflight risk, not an observed unsafe execution.

Correction: make safety and sensitive-data boundaries explicitly precede user/source priority; inspect relevant script effects before execution; require exact approval for permitted consequential actions and block prohibited or unresolved effects. Scope “real data” to authorized, non-sensitive fixtures/read paths.

### AUDIT-002: Retired package policy finding

Status: **Retired — Shell Safety package removed by user request.** Its original policy repairs were assessed in the earlier snapshot; no active repair task remains for this package.

### AUDIT-003: Review Skills still lacks a complete composition contract

Severity: **HIGH**
Area: Instruction architecture
Status: **Open; four-level severity mapping is a partial repair**

Locations: [Finding Quality](review-skills/skills/review-finding-quality/SKILL.md), lines 25–31; [Multi-Lens Review](review-skills/skills/multi-lens-review/SKILL.md), lines 94–113; [Gatekeeper](review-skills/skills/review-cycle-gatekeeper/SKILL.md), lines 30–53; [Single-Pass Review](review-skills/skills/single-pass-review-completeness/SKILL.md), Output Format; [Fix Batching](review-skills/skills/fix-batching-and-root-cause/SKILL.md), Procedure step 1.

Evidence: Finding Quality uses `blocker | should-fix | suggestion`; Multi-Lens Review uses `CRITICAL | HIGH | MEDIUM | LOW` and `BLOCK | CONCERNS | CLEAN`; Gatekeeper maps the four-level severity vocabulary but requires a stable finding ID. Single-Pass Review does not require stable IDs, and Fix Batching assigns local `F1`, `F2`, … IDs while retaining supplied identifiers in restatements. That retention is a partial repair, but no shared rule defines which ID the next gate must use.

Risk: a composed review round must guess severity conversion, identity continuity, and the relationship between stage-specific verdicts. Finding identity continuity is underspecified, and findings can receive an inconsistent merge-gate treatment even when each standalone report follows its own format.

Correction: define one shared handoff schema with stable IDs, source severity, canonical gate severity, resolution state, and explicit stage-verdict mappings. Preserve standalone envelopes as adapters to that schema.

### AUDIT-004: Model floors remain unmeasured

Previous severity: **MEDIUM**
Status: **Retained as an evidence limitation, not a demonstrated instruction defect**

The current checks validate text invariants, examples, schemas, and prepared fixtures. They do not run representative tasks across the named models. No empirical model floor, pass rate, provider availability, or live runtime certification is claimed in this rerun. Absence of behavioral measurements alone does not prove that an otherwise coherent skill needs revision.

### AUDIT-005: Metadata still advertises absent skills

Severity: **MEDIUM**
Area: Discovery and delegation
Status: **Open**

Locations: [Architecture manifest](architecture-skills/plugin.json), line 4; [Specification manifest](specification-skills/plugin.json), lines 4 and 19; [Copilot catalog](.github/plugin/marketplace.json), lines 13 and 63; package READMEs and shipped skill directories.

Evidence: Architecture advertises “planning safe data migrations”; Specification advertises “handling mid-build spec deviations” and “decomposing specs into implementation tasks.” The seven Architecture and eight Specification skills contain no corresponding workflows.

Risk: discovery promises behavior that the installed package cannot supply. The path-only Codex catalog does not repeat these descriptive claims.

Correction: remove the unsupported claims from both root manifests and the Copilot catalog, or ship the missing workflows and document them consistently.

### AUDIT-006: Code Explorer's orchestration does not consistently respect selected modes

Severity: **HIGH**
Area: Operational completeness
Status: **New**

Locations: [Explorer agent](code-explorer/agents/code-explorer.agent.md), lines 38–45, 86–98, and 113–130; [Execution modes](code-explorer/shared/execution-modes.md), `chat-only`, `refresh`, `partial`, and `validation`.

Evidence: `chat-only` says “Do not create or modify any files”; `validation` says “Do not regenerate content.” Nevertheless Phase 0 says “If it exists, switch to refresh mode,” and Final Assembly unconditionally directs writing summary/navigation artifacts. The agent's completion criteria require the full exploration deliverable set even after a partial run.

Risk: explicit chat-only/validation requests encounter refresh/write instructions, while partial runs encounter full-run completion demands. Refresh does ask the user which artifacts to refresh, so this is not proof of automatic unauthorized writing; it is a reachable mode/scope conflict requiring interpretation.

Correction: select the requested mode once, preserve its write permissions, and give chat-only, partial, validation, initial, and refresh paths separate assembly/validation/completion rules. Directory existence must not override the selected mode.

### AUDIT-007: Code Explorer's provenance example fails its authoritative schema

Severity: **MEDIUM**
Area: Maintainability and evaluability
Status: **New**

Locations: [Provenance Stamp](code-explorer/shared/exploration-protocol.md), lines 99–120; [Output contracts](code-explorer/shared/output-contracts.md), lines 5–28; [Common schema](code-explorer/shared/schemas/common.schema.json), artifact metadata definition.

Evidence: the protocol example has `"schemaVersion": 1`, `"mode": "full"`, and no `_meta.schema`. The contract requires a string schema version and schema name, with mode `initial | refresh | partial | validation`.

Risk: copying the mandatory provenance example produces invalid metadata. The output contract explicitly makes schemas authoritative, so precedence exists; the defect is a misleading co-loaded example and avoidable validation/rework, rather than an impossible schema contract.

Correction: replace the invalid example with schema-valid metadata and use the same mode vocabulary for Markdown provenance, or link directly to the authoritative metadata definition.

### AUDIT-008: Retired package deletion-recipe finding

Status: **Retired — Shell Safety package removed by user request.** Removal retires the finding without claiming the deletion recipes were repaired.

### AUDIT-009: Specification Skills has inconsistent edit/retention instructions

Severity: **MEDIUM**
Area: Operational completeness
Status: **New**

Locations: [Requirement Sharpening](specification-skills/skills/requirement-sharpening/SKILL.md), Procedure / Output mode rules; [Artifact Consolidation](specification-skills/skills/artifact-consolidation/SKILL.md), Procedure step 7 / Output Format / Anti-Patterns.

Evidence: Sharpening's procedure says “Apply rewrites in place,” while audit mode is findings-only and applies when source editing is out of scope. Consolidation says “Mark superseded sources for removal — do not delete,” but its anti-patterns include “Leaving the source documents in place after merging.”

Risk: an audit can be interpreted as requiring edits, or correctly retained superseded files can be treated as incomplete consolidation. The explicit retention/approval rules reduce the deletion risk but do not make the contradictory checklist reliable.

Correction: make in-place edits conditional on authorized sharpen mode; in audit mode return findings only. Change the consolidation anti-pattern to leaving superseded sources unmarked or continuing to treat them as authoritative.

### AUDIT-010: Instructions Authoring's package guide omits a shipped skill

Severity: **LOW**
Area: Discovery and delegation
Status: **New**

Locations: [Package README](instructions-authoring/README.md), lines 5–27; [Controlled Agent Instruction English](instructions-authoring/skills/controlled-agent-instruction-english/SKILL.md).

Evidence: `What ships`, slash commands, and the stage/skill table list three skills, while the package currently ships four.

Risk: users following the package guide cannot discover the controlled-English author/rewrite/audit workflow. The skill itself has valid routing metadata, so this is a localized documentation gap.

Correction: add the fourth skill to the package inventory, invocation list, and workflow table.

## Target-Model Compatibility

The verdict below is for **reliable execution of every advertised/normal workflow in the collection as written**, not for every standalone skill. Each target remains unsuitable for that complete claim because the package defects require repair. The profile-specific notes identify useful bounded fits without asserting benchmark results or a total ordering across providers.

| Model | Verdict | Main risk / static profile fit | Required adaptation |
|---|---|---|---|
| GPT-6 Luna | Unsuitable | Broad orchestration and cross-file synthesis exceed the shallow, bounded profile; some individual skills fit | Repair structural defects; scope bounded tasks and keep branches/parameters explicit |
| GPT-6 Sol | Unsuitable | Plausible strong-general fit for bounded implementation/review; collection-level contract gaps remain | Repair defects; provide evidence, permissions, and completion criteria |
| GPT-6.1 Sol | Unsuitable | Plausible broad coding/synthesis fit; unconditional phase/assembly rules can overconstrain selected scopes | Repair mode/composition rules; retain efficient workflow choice |
| GPT-6 Astra | Unsuitable | Plausible complex synthesis fit; stronger reasoning cannot settle missing authority/identity contracts | Repair defects; preserve hard boundaries and tool-grounded completion |
| Claude Haiku 5.5 | Unsuitable | Bounded skills fit the profile better than the hardest multi-workstream paths; effort/thinking unknown | Repair defects; make defaults and stopping states explicit; verify actual runtime settings |
| Claude Sonnet 5 | Unsuitable | Plausible bounded multi-step fit; scope and handoff contracts must remain literal | Repair defects; state per-file/per-finding scope and conversions |
| Claude Sonnet 5.5 | Unsuitable | Plausible strong-general fit; effort-dependent completion/verification is unmeasured | Repair defects; verify effort and completion behavior independently |
| Claude Opus 4.8 | Unsuitable | Plausible complex-analysis fit; current-state evidence and empirical verification remain separate | Repair defects; require evidence-producing tool use |
| Claude Opus 5 | Unsuitable | Plausible outcome-driven synthesis fit; structural ambiguity survives model choice | Repair defects; preserve scope, uncertainty, and verification status |
| Claude Opus 5.5 | Unsuitable | Plausible complex/unattended-work fit; host continuation/completion handling unverified | Repair defects; verify runtime completion handling when a harness is supplied |
| Claude Fable 5 | Unsuitable | Plausible long-horizon fit; selected scope and safety checkpoints need deterministic outcomes | Repair defects; retain bounded mission and explicit pause conditions |
| Claude Fable 5.1 | Unsuitable | Plausible long-horizon fit; compaction and constraint preservation unverified | Repair defects; verify host history and pending-work handling |
| Claude Mythos 5.1 | Unsuitable | Assessed separately against its declared profile; access/runtime readiness unverified | Repair defects; verify access and host behavior before claiming runtime suitability |

No model-specific patch is justified merely by these labels. Model Panel's coordinator assessment does not certify its routed targets. Review Forge's conservative isolation boundary is a limitation: a context-rich request cannot complete the default independent lens in that same conversation; use a fresh diff-only request or explicitly exclude the lens. This behavior is documented and is not counted as a new authority defect.

### Validation evidence

All checks below passed on **2026-10-12**:

- `node dev/model-panel/scripts/lint-model-panel.mjs`
- `node dev/review-forge/scripts/lint-review-forge.mjs`
- `node dev/code-smith/scripts/lint-code-smith.mjs`
- `node dev/planning-forge/scripts/lint-examples.mjs` — 11 fixtures.
- `node dev/planning-forge/scripts/test-metamodel-validator.mjs`
- `node dev/code-explorer/tests/validate-fixtures.mjs` — 25 checks, zero warnings/errors.
- `git diff --check`

Additional static inspection confirmed that all repository JSON files parse, both marketplace catalogs resolve to existing package directories, all 11 packages have root manifests, and local Markdown links resolve. This is syntax/path validation, not external manifest-schema or installation certification. Prepared Code Explorer fixtures passing does not validate the conflicting instruction example or run an exploration agent.

## Priority Changes

1. Make executable safety deterministic: repair Prototype Spike precedence/preflight.
2. Repair Code Explorer's selected-mode boundaries, mode-specific completion, and provenance examples; add focused static regressions for those contracts.
3. Define Review Skills' shared finding/severity/identity/verdict handoff contract.
4. Reconcile Specification Skills' audit/edit and superseded-source retention rules; align package/catalog discovery descriptions with shipped skills, including Instructions Authoring's fourth skill.
5. Before publishing empirical model-floor claims, run representative hardest-path behavioral checks with recorded snapshots, effort, tools, permissions, inputs, and outcomes. This rerun neither performs nor authorizes paid evaluations.

Verdict: Needs revision
