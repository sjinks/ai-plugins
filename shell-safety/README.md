# shell-safety

A plugin that ships a catalog of dangerous shell command patterns and safe rewrites for AI agents. It does not install hooks or intercept execution. It works by description-trigger loading: when the agent considers composing or running a shell command, the skill's description vocabulary matches and the body's checklist is loaded into context.

## What ships

- `skills/shell-command-safety/SKILL.md` — entry point with checklist, stop-and-ask cases, and links to references.
- `skills/shell-command-safety/references/patterns-catalog.md` — full catalog of ~150 dangerous patterns, grouped by category.
- `skills/shell-command-safety/references/rewrite-recipes.md` — copy-paste safe rewrites for every pattern ID.
- `skills/shell-command-safety/references/quoting-rules.md` — concise bash/zsh quoting and expansion reference.
- `skills/shell-command-safety/assets/commit-message-template.txt` — template for `git commit -F` workflows.

## Loading guarantee

Without hooks, the skill cannot deterministically block bad commands. To strengthen the load guarantee, paste this anchor into your `AGENTS.md` (user or workspace level):

```markdown
## Mandatory defaults
- Always load the `shell-command-safety` skill before composing or running any shell command beyond trivial reads (`git status`, `ls`, `pwd`, `cat <simple-file>`). The skill catalogs dangerous patterns and provides safe rewrites.
```

`AGENTS.md` is read on every turn, so the rule is always in context; the skill itself only auto-loads when its description matches.

## Slash command

After installation, type `/shell-command-safety <command>` in chat to validate a specific command against the catalog on demand.

## Coverage

The catalog covers ~150 patterns across 21 categories: git commit hazards, git destruction, filesystem, quoting & expansion, command substitution & pipes, heredocs, process control, network & supply-chain, permission escalation, redirection, shell-mode safety, SSH & remote execution, GPG & signing, cloud CLIs (AWS / gcloud / az), infrastructure as code (Terraform / Pulumi), containers & orchestration (Docker / Kubernetes / Helm), database CLIs, systemd & service control, secret & environment hygiene, archives & compression, encoding & locale.

## Scope (v1)

- Documentation + checklist only. No hooks. No execution interception.
- Markdown catalog only. A machine-readable JSON sidecar is reserved for a future hook layer.
