# instructions-authoring

A plugin that ships instruction-authoring skills for AI agents. It focuses on building, auditing, and adapting instruction packages so they stay portable across models, internally consistent, and ready for reuse.

## What ships

- `skills/cross-model-instruction-authoring/` — create or revise Agent Skills, custom agent prompts, subagent instructions, and other instruction packages so they work across multiple models and runtimes.
- `skills/agent-skill-audit/` — assess whether an agent instruction or skill package is ready for its target models and runtime, with a focus on discovery, completeness, portability, and maintainability.
- `skills/instruction-quality-audit/` — diagnose exact defects in AI instruction artifacts, including contradictions, ambiguity, authority conflicts, closure gaps, duplicated rules, and output-contract problems.

## Slash commands

After installation, each skill is invocable on demand:

```
/cross-model-instruction-authoring
/agent-skill-audit
/instruction-quality-audit
```

## Where each skill fits

| Stage | Skill |
|---|---|
| Designing a reusable instruction package | `cross-model-instruction-authoring` |
| Auditing a skill package for readiness | `agent-skill-audit` |
| Finding exact instruction defects | `instruction-quality-audit` |

## Scope

- Documentation + checklist skills only. No hooks.
- Skills load by description-trigger matching and can also be invoked explicitly as slash commands.