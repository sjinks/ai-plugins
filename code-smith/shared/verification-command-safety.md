# Command Safety Reference

This reference defines Test Smith's self-contained command-safety rules. It is a local reference, not an invocable skill. No external safety skill is required.

Read it before any `execute` call. When unsure, fail closed: ask, skip, or report blocked.

## Command Classes

- **`trivially-safe`** — local read-only inspection, or local workspace-bounded verification that writes only expected disposable build/test/lint/typecheck artifacts inside the workspace and makes no source, test, fixture, snapshot, checked-in config, dependency, git, PR, deploy, production, service, network, secret, or external-path change.
- **`approval-bound`** — a verification command with unclear side effects, optional network/scanner behavior, external read-only targets, non-persistent terminal output, or effects beyond expected local disposable outputs, as long as it does not write outside workspace-local disposable verification output directories, mutate repo source/config/dependency/git/PR/deploy/production/service state, or transmit sensitive data. Requires exact-command approval unless forbidden.
- **`forbidden`** — git/PR/deploy/production-state mutation, dependency installs, file writes outside workspace-local disposable verification output directories, generated output outside the Local Workspace-Bounded Verification exception, edits to source/tests/config/snapshots, dependency publishing, safety/verification hook bypass, secret disclosure, or any command outside verification scope.
- **`unknown`** — insufficient information to classify. Ask for clarification or report blocked.

## Procedure

1. **Classify** the command before running it.
2. **Resolve safely.** Expand globs only when their expansion is already known and safe. Do not execute command substitutions, backticks, process substitutions, `eval`, or generated command fragments to resolve a command. If a substitution cannot be resolved from existing evidence, treat the command as non-trivial and ask for the exact resolved form.
3. **Bind the decision.** A `trivially-safe` local-verification classification applies only to the exact resolved command, working directory, relevant environment/options, output paths, targets, and current local evidence used to classify it. Reclassify when any of those change, or when relevant scripts, manifests, CMake/build files, lock/dependency files, tool configuration, or output paths change.
4. **Protect secrets.** Do not expand secret-bearing variables to literal values. Keep variable names and note they are secret. Redact secrets, credentials, tokens, PII, raw customer data, and production identifiers from output summaries.
5. **Confirm or refuse.** Ask for explicit approval of the exact restated command for approval-bound commands. Refuse forbidden commands.
6. **Run and record** only approved or trivially-safe commands. Capture exit status and a concise redacted evidence summary.

## Local Workspace-Bounded Verification

Build, test, lint, typecheck, static-analysis, and code-generation commands may be classified as `trivially-safe` when all of these are true:

- The command is discovered from repository configuration or explicitly requested by the user for verification.
- All writes are limited to expected disposable verification outputs inside the workspace, such as `build/`, `cmake-build-*`, `.pytest_cache/`, coverage output, test caches, compiled objects, binaries, or generated project files in an explicit disposable output directory.
- The command does not edit source files, tests, fixtures, snapshots, checked-in configuration, checked-in generated artifacts, source-like generated files, dependency manifests, lock files, git state, PR/deploy state, production/service state, or paths outside the workspace.
- The command does not install dependencies, invoke package-manager install/update commands, publish packages, contact the network, request secrets, or print secret-bearing values.
- Any output directory is explicit or can be safely inferred as a workspace-local disposable directory that is ignored, untracked, or documented as disposable.
- For package-manager commands, language-tool commands, build-system commands, and repository scripts, absence of known unsafe evidence is not enough. First inspect the relevant local scripts, manifests, lock/dependency files, build configuration, generated build graph when present, tool configuration, and available cache/state evidence well enough to establish that the command will not install, update, fetch, publish, contact the network, control services, use external output paths, or update checked-in files. If that cannot be established from local evidence, classify the command as `approval-bound` or `unknown`.
- For local workspace-bounded verification commands that can write disposable outputs, inspect workspace state before and after execution. If the command changes anything outside the approved disposable output/cache directories, treat the verification as failed or blocked and report the unexpected change.

Examples that may be `trivially-safe` when they satisfy the rules above: `cmake -S . -B build`, `cmake --build build`, `ctest --test-dir build`, `ninja -C build`, `make -C build`, `npm test`, `npm run lint`, `pytest`, `go test ./...`, and `cargo test`.

If local evidence shows, or cannot rule out for scripted/package-manager/language-tool/build-system commands, that a command fetches dependencies, runs an install/update step, writes checked-in files, uses external output paths, controls services, or otherwise exceeds the conditions above, classify it as `approval-bound` or `forbidden` as appropriate.

## Always Forbidden

- Editing, deleting, overwriting, moving, or generating source, tests, fixtures, snapshots, checked-in configuration, checked-in generated artifacts, source-like generated files, or lock/dependency files in the workspace. Expected disposable coverage/build/test artifacts are allowed only under Local Workspace-Bounded Verification.
- Creating branches, staging, committing, pushing, rewriting history, opening pull requests, or deploying.
- Production-state or service-control commands.
- Dependency installs. Network/scanner commands are allowed only when the user explicitly requested and approved the exact command, and only if they do not mutate state or transmit sensitive data.
- Any mechanism that skips, disables, or short-circuits configured safety or verification hooks, including flags, environment variables, hooks-path overrides, or editing/removing hooks.
- Commands that print, persist, or exfiltrate secrets.

## Denied Or Unsafe Commands

If the user denies approval, or the command cannot be made safe, do not run it. Mark the affected check as `skipped` or `blocked`, explain why, and ensure the overall status is not `verified` when the check is required.
