# Tooling Adapter Reference

This reference makes Code Explorer portable across agent environments. It is a local reference, not an invocable skill. Skills describe what they need by **capability**; this file maps capabilities to concrete tools per environment.

## Capability Table

| Capability | Generic shell | Claude Code | Codex | Copilot / VS Code |
|---|---|---|---|---|
| Read file | `cat`, `sed -n` | read tool | shell / read | read-file tool |
| List directory | `ls`, `find` | list tool | shell `ls` | list-dir tool |
| Search text | `rg`, `grep` | search tool | shell `rg` | text-search tool |
| Find files | `rg --files`, `git ls-files` | search tool | shell | file-search tool |
| Create / edit file | heredoc, `apply_patch` | edit tool | `apply_patch` | edit-file tool |
| Run command / tests | shell | shell | shell | run-in-terminal tool |
| Read git history | `git log`, `git blame` | shell | shell | run-in-terminal tool |
| Ask the user | chat | ask tool | chat | ask-questions tool |

## Rules

- Skills refer to capabilities ("use the search capability"), not to a specific tool name, except where a concrete example command is helpful.
- When a capability is unavailable in the current environment, degrade gracefully: prefer the closest read-only alternative and record the limitation. For example, if no command execution is available, simulate `validate-artifacts.mjs` by reading the artifacts directly per the `artifact-validation` skill.
- Never assume a specific editor, platform, or shell is present. The helper scripts require only Node.js (no external packages).
- Prefer tools that respect `.gitignore` (`git ls-files`, `rg --files`) so heavy directories are skipped without manual pruning.
