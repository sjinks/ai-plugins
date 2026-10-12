# commit-discipline-skills

A plugin that ships commit and pull request discipline workflow skills for AI agents. Each skill targets a specific part of preparing work for review or merge: cleaning an unmerged branch's commit sequence, producing a durable commit message, and writing a reviewer-ready pull request title and body.

The skills produce advisory reports and text. They may inspect supplied evidence and readable repository rules, but do not execute Git operations, rewrite history, push branches, publish pull requests, or run checks. Their descriptions state when each skill applies; a compatible host can use those descriptions for discovery.

## What ships

- `skills/commit-hygiene/` — plan cleanup for one unmerged linear commit range by recommending squash, drop, reword, split, reorder, or keep actions, with an interactive-rebase todo and safety cautions. It does not execute the plan or draft commit messages.
- `skills/commit-message-quality/` — write, rewrite, validate, or audit one commit message for a conventional or plain subject, a why-focused body, valid footers, and no leaked sensitive content.
- `skills/pr-description-quality/` — write, rewrite, validate, or audit one pull request title and description against reviewer-facing quality rules, honoring the repository's pull request template when present.

## Skill names

Use these names to select a skill where the host supports explicit invocation:

```
commit-hygiene
commit-message-quality
pr-description-quality
```

## Where each skill fits

| Stage | Skill |
|---|---|
| Cleaning branch history | `commit-hygiene` |
| Preparing one commit | `commit-message-quality` |
| Preparing a pull request | `pr-description-quality` |

## Scope

- Skill instructions and references only. No hooks or execution interception.
- Skills return recommended text or plans; they do not mutate local git state or remote pull requests.
- Actual discovery and explicit invocation syntax depend on the host.
