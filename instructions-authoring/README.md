# instructions-authoring

A plugin that ships instruction-authoring skills for AI agents. It covers cross-model authoring, controlled-English instruction writing, readiness assessment, and detailed instruction diagnostics.

## What ships

- `skills/cross-model-instruction-authoring/` — create or revise Agent Skills, custom agent prompts, subagent instructions, and other instruction packages for use across selected models and runtimes, separating portable behavior from runtime-specific adapters.
- `skills/agent-skill-audit/` — assess whether an agent instruction or skill package is ready for its target models and runtime, with a focus on discovery, completeness, portability, and maintainability.
- `skills/instruction-quality-audit/` — diagnose exact defects in AI instruction artifacts, including contradictions, ambiguity, authority conflicts, closure gaps, duplicated rules, and output-contract problems.
- `skills/controlled-agent-instruction-english/` — write, rewrite, or audit model-facing operational prose for consistent terminology, explicit modality and scope, conditions, precedence, and failure behavior.

## Skill names

Use these names to select a skill where the host supports explicit invocation:

```
cross-model-instruction-authoring
agent-skill-audit
instruction-quality-audit
controlled-agent-instruction-english
```

## Where each skill fits

| Stage | Skill |
|---|---|
| Designing a reusable instruction package | `cross-model-instruction-authoring` |
| Auditing a skill package for readiness | `agent-skill-audit` |
| Finding exact instruction defects | `instruction-quality-audit` |
| Writing or auditing precise operational prose | `controlled-agent-instruction-english` |

## Scope

- Skill instructions and references only. No hooks.
- Skill descriptions state when they apply. Actual discovery and explicit invocation syntax depend on the host.
