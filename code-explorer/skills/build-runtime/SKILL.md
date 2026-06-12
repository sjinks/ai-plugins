---
name: build-runtime
description: "Use when: determining how a repository is built, tested, run, and deployed during deep codebase exploration: install/build/run/test commands, runtime services, external dependencies, environment variables, and CI/CD flow. Phase 2 of the Code Explorer workflow."
argument-hint: "Repository scope; whether running build/tests is approved."
user-invocable: true
---

# Build and Runtime Detection

Understand how the system is built, tested, run, and deployed. This is Phase 2 of the Code Explorer workflow; it requires the repository map from Phase 1 (or equivalent knowledge of manifests and tooling).

Follow the evidence, confidence, safety, and provenance rules in the plugin's `shared/exploration-protocol.md`. Output contract: `02_BUILD_AND_RUNTIME.md` in `shared/output-contracts.md`. Both files live at the plugin root, sibling of `skills/`. When run standalone, those rules still apply; if either reference is unavailable, stop and report it.

## Tasks

1. Read package/build/runtime config files (manifests, lockfiles, Makefiles, Dockerfiles, compose files, CI workflows).
2. Identify main scripts and commands for install, build, run, and test.
3. Identify runtime shapes: services, workers, CLIs, HTTP servers, cron jobs, migrations, queues, background processors.
4. Identify required environment variables: search for `process.env`, `os.environ`, `getenv`, `env(`, config loaders, and `.env.example` files. Record purpose, required/optional, default, and evidence for each.
5. Identify external dependencies: databases, caches, queues, object storage, external HTTP APIs, filesystem paths, secrets, cloud services.
6. Identify the local development flow (from README, contributing docs, scripts).
7. Identify the CI flow: what each workflow runs, on which triggers.
8. Run tests/build only if the session-level approval was granted and the environment is already configured. When run standalone and approval status is unknown, ask the user once before running anything. Record command output or failures concisely under `Observed command results` (for example: `npm test — 142 passed, 0 failed (run 2026-06-12)`).

## Rules

- Never install dependencies to make a build or test run work. Record the limitation.
- A command documented in the README but never verified is `Medium` confidence at best; mark commands you actually ran as `High` with their observed result.
- Failing builds or tests are findings, not blockers: record the failure output snippet and continue.
- Environment variables found only in deployment config (not code) still count; cite the config file as evidence.

## Output

Write `02_BUILD_AND_RUNTIME.md` per `shared/output-contracts.md`, with a provenance stamp. Document everything you could not verify under `Limitations`.
