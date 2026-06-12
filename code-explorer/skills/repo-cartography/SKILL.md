---
name: repo-cartography
description: "Use when: mapping repository structure during deep codebase exploration: languages, frameworks, package managers, build systems, test frameworks, CI/CD workflows, top-level directory purposes, and generated/vendored paths to exclude. Phase 1 of the Code Explorer workflow."
argument-hint: "Repository root or scope path to map."
user-invocable: true
---

# Repository Cartography

Create a high-level map of the repository: what it is made of, how it is organized, and what to ignore. This is Phase 1 of the Code Explorer workflow and the foundation for every later phase.

Follow the evidence, confidence, safety, and provenance rules in the plugin's `shared/exploration-protocol.md`. Output contracts are in `shared/output-contracts.md` (`01_REPOSITORY_MAP.md`, `machine-readable/repository_index.json`). Both reference files (`shared/exploration-protocol.md` and `shared/output-contracts.md`) live at the plugin root, sibling of `skills/`; output artifacts go under the explored repository's `docs/codebase-exploration/`. When run standalone, those rules still apply; if either reference is unavailable, stop and report it.

## Tasks

1. Identify languages used (by extension counts and manifest files, not guesswork).
2. Identify frameworks and runtime platforms.
3. Identify package managers.
4. Identify build systems.
5. Identify test frameworks.
6. Identify CI/CD workflows.
7. Note where deployment/runtime configuration lives, under `Notable configuration files`; its analysis happens in Phase 2.
8. Identify generated, vendored, build-output, and third-party directories. Record them as the ignore list for all later phases.
9. Identify major top-level directories and their purpose, each with confidence and evidence.

## Useful Commands

Read-only inspection only. Prefer `git ls-files` and `rg --files` (both respect `.gitignore` and skip dependency/build directories); when using `find`, prune ignored directories explicitly so the command never descends into them:

```text
git ls-files | head -200
rg --files | sed 's#.*\.##' | sort | uniq -c | sort -rn | head -20
find . -maxdepth 3 -type d \( -name node_modules -o -name vendor -o -name dist -o -name build -o -name .git \) -prune -o -type d -print | sed 's#^\./##' | sort
```

Look for marker files such as:

```text
package.json, pnpm-lock.yaml, yarn.lock, package-lock.json,
composer.json, Cargo.toml, go.mod, pyproject.toml, requirements.txt,
CMakeLists.txt, Makefile, Dockerfile, docker-compose.yml,
.github/workflows/*, tsconfig.json, eslint.config.*,
jest.config.*, vitest.config.*, phpunit.xml, psalm.xml, phpstan.neon,
openapi.*, swagger.*
```

Also read `.gitignore` and check for the presence of `vendor/`, `node_modules/`, `dist/`, `build/`, `generated/` directories to populate the ignore list. Do not traverse or read the contents of these directories; existence checks are enough.

## Rules

- A directory's purpose is `High` confidence only with direct evidence (manifest, README, imports). Name-based guesses are `Low` or `Medium` and labeled as inferred. Example row: `| src/api/ | HTTP route handlers | High | src/api/index.ts registers Express routes |`.
- Do not enumerate every file. Map the shape; later phases go deep.
- Multi-package repositories (monorepos, workspaces): record each package as a top-level unit with its own manifest evidence.
- If the file count after exclusions exceeds the repository-size budget in the protocol, report it to the orchestrator (or user, when standalone) before later phases begin.

## Output

Write `01_REPOSITORY_MAP.md` and `machine-readable/repository_index.json` per `shared/output-contracts.md`, with provenance stamps. Record anything you could not determine under the `## Limitations` section of the markdown artifact.
