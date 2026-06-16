# Command Safety Reference

This reference defines Test Smith's self-contained command-safety rules. It is a local reference, not an invocable skill. No external safety skill is required.

Read it before any `execute` call. When unsure, fail closed: ask, skip, or report blocked.

## Command Classes

- **`trivially-safe`** — local read-only inspection that makes no file, persistent process/service, network, dependency, git, service, or environment change.
- **`approval-bound`** — a non-trivial local verification command, a command with unclear side effects, or an explicitly requested network/scanner command that does not mutate repo, dependency, git, PR, deploy, production, or service state and does not transmit sensitive data. Requires exact-command approval unless forbidden.
- **`forbidden`** — git/PR/deploy/production-state mutation, dependency installs, workspace-writing generated output, edits to source/tests/config/snapshots, dependency publishing, safety/verification hook bypass, secret disclosure, or any command outside verification scope.
- **`unknown`** — insufficient information to classify. Ask for clarification or report blocked.

## Procedure

1. **Classify** the command before running it.
2. **Resolve safely.** Expand globs only when their expansion is already known and safe. Do not execute command substitutions, backticks, process substitutions, `eval`, or generated command fragments to resolve a command. If a substitution cannot be resolved from existing evidence, treat the command as non-trivial and ask for the exact resolved form.
3. **Protect secrets.** Do not expand secret-bearing variables to literal values. Keep variable names and note they are secret. Redact secrets, credentials, tokens, PII, raw customer data, and production identifiers from output summaries.
4. **Confirm or refuse.** Ask for explicit approval of the exact restated command for approval-bound commands. Refuse forbidden commands.
5. **Run and record** only approved or trivially-safe commands. Capture exit status and a concise redacted evidence summary.

## Always Forbidden

- Editing, deleting, overwriting, moving, or generating source, tests, fixtures, snapshots, configuration, coverage/build artifacts, or lock/dependency files in the workspace.
- Creating branches, staging, committing, pushing, rewriting history, opening pull requests, or deploying.
- Production-state or service-control commands.
- Dependency installs. Network/scanner commands are allowed only when the user explicitly requested and approved the exact command, and only if they do not mutate state or transmit sensitive data.
- Any mechanism that skips, disables, or short-circuits configured safety or verification hooks, including flags, environment variables, hooks-path overrides, or editing/removing hooks.
- Commands that print, persist, or exfiltrate secrets.

## Denied Or Unsafe Commands

If the user denies approval, or the command cannot be made safe, do not run it. Mark the affected check as `skipped` or `blocked`, explain why, and ensure the overall status is not `verified` when the check is required.
