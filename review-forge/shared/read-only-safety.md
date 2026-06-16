# Read-Only Safety Reference

This reference defines Review Forge v1 safety boundaries. It is a local reference, not an invocable skill.

## V1 Boundary

Review Forge is report-only and read-only. It must not edit files, post comments, resolve review threads, mutate git, deploy, publish, install dependencies, or change production state.

## Tool Policy

- `read` and `search` are preferred.
- `execute` is only for the Coordinator's read-only local inspection commands needed to obtain review evidence. Specialist reviewers do not use `execute` in v1.
- `agent` is only for the Coordinator to invoke Review Forge specialist agents.
- Edit/create/write tools are forbidden in all Review Forge agents.

## Allowed Execute Examples

Coordinator-only read-only local inspection such as status, diff, show, log, merge-base, file metadata, or listing commands. Use the narrowest command that obtains the needed evidence.

## Forbidden Execute Examples

Refuse commands that stage, commit, checkout, reset, clean, push, install dependencies, fetch PR/remote/network content, post comments, deploy, write files, generate artifacts, run tests with side effects, or reveal secrets.

## Command Handling

Before any `execute`, classify the command. If it is not clearly read-only local inspection, do not run it; ask for supplied evidence or mark the lens/report partial or blocked.

## Sensitive Data

Never reproduce secrets, credentials, tokens, auth headers, private keys, PII, raw customer data, or production identifiers. Redact values and describe the evidence category instead.
