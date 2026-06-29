# commit-discipline-skills

A plugin that ships commit and pull request discipline workflow skills for AI agents. Each skill targets a specific part of preparing work for review or merge: cleaning an unmerged branch's commit sequence, producing a durable commit message, and writing a reviewer-ready pull request title and body.

The skills are advisory and do not run git, rewrite history, push branches, edit live pull requests, or call external APIs. They load by description-trigger matching when the agent works on commit, branch hygiene, or pull request description tasks. Each skill is also user-invocable as a slash command.

## What ships

- `skills/commit-hygiene/` — clean up one unmerged branch's commit sequence by recommending squash, drop, reword, split, reorder, or keep actions, with an interactive-rebase todo and safety cautions.
- `skills/commit-message-quality/` — write, rewrite, validate, or audit one commit message for a conventional or plain subject, a why-focused body, valid footers, and no leaked sensitive content.
- `skills/pr-description-quality/` — write, rewrite, validate, or audit one pull request title and description against reviewer-facing quality rules, honoring the repository's pull request template when present.

## Slash commands

After installation, each skill is invocable on demand:

```
/commit-hygiene
/commit-message-quality
/pr-description-quality
```

## Where each skill fits

| Stage | Skill |
|---|---|
| Cleaning branch history | `commit-hygiene` |
| Preparing one commit | `commit-message-quality` |
| Preparing a pull request | `pr-description-quality` |

## Scope

- Documentation + checklist skills only. No hooks. No execution interception.
- Skills return recommended text or plans; they do not mutate local git state or remote pull requests.
- Skills load when their description vocabulary matches, and can be invoked explicitly as slash commands.