---
name: dev-container-generation
description: "Use when: turning an architecture specification and repository evidence into a development-oriented container setup (Dockerfile, .dockerignore, and optional compose.yaml): base image and pinned tag selection, dependency-layer caching, dev affordances (bind mounts, watch, dev dependencies), backing services, non-root user, healthchecks, and secret-safe configuration."
argument-hint: "The architecture spec or stack summary, the repository (or its manifests/lockfiles), and any dev constraints (target runtime version, backing services, registry/base-image policy)."
user-invocable: true
---

# Dev Container Generation

Turn an architecture specification plus repository evidence into a container setup a developer can build and work in. An architecture spec is deliberately language-agnostic; a Dockerfile must commit to a concrete runtime, version, and layout. This skill resolves that gap safely, favoring reproducibility and developer ergonomics over production hardening.

## When to Use

Use when a project needs a containerized development environment derived from a known stack: generating or auditing a `Dockerfile`, `.dockerignore`, and an optional `compose.yaml` for local development. The output targets a developer's inner loop — fast rebuilds, dev dependencies, source bind mounts, and reachable backing services.

Out of scope: production or release image hardening (distroless slimming, SBOM, image signing, multi-arch release matrices), Kubernetes manifests and Helm charts, CI runner image design, container runtime incident response, and registry or orchestration platform selection. A production image is a separate target with different tradeoffs; do not conflate the two.

## Required Inputs

- The stack: a language named by the user request, the architecture spec, or repository evidence. A named language satisfies the stack input even when the version is still `unknown`; a spec alone is enough to begin but is usually insufficient to pin a version.
- Repository evidence when a repo is available: manifests and lockfiles (`package.json`/lockfile, `pyproject.toml`/`requirements.txt`/`poetry.lock`, `go.mod`, `Cargo.toml`, `composer.json`, `*.csproj`, `Gemfile.lock`), version pins (`.nvmrc`, `.tool-versions`, `.python-version`, `engines`/`rust-version`/`go` directives), and any existing `Dockerfile`, `compose.yaml`, or `.dockerignore`.
- Dev constraints when supplied: required runtime version, base-image or registry policy, backing services (databases, caches, queues) named in the spec's data flow, exposed ports, and required dev tooling.

If no stack can be derived from the user request, repository evidence, or the architecture spec, emit the BLOCK template; do not guess a language or invent a version.

When repository evidence indicates more than one language stack (for example `package.json` and `pyproject.toml` both present), name each detected stack and ask which service to containerize, or scope to the stack named by the spec; do not silently choose one.

This skill is advisory: it produces the plan. Running `docker build` / `docker compose config` is a recommended next action for the host agent or user, not something this skill executes.

## Input Precedence

Resolve conflicts in this order. Higher sources win; record overridden lower-source signals as notes, not as silent drops.

1. Explicit current user request and dev constraints.
2. Repository evidence: version-pin files and manifest version directives are authoritative for the runtime version; lockfiles are authoritative for dependency resolution only, not the runtime version.
3. Architecture specification (authoritative for backing services, ports, data flow, and trust boundaries).
4. The Decision Checklist and Rules below (their default choices when no higher source decides).

When the spec names a service (for example "reads from Postgres") but no repo evidence pins a version, the service belongs in `compose.yaml` and its version is `unknown` until confirmed — surface it under `### Evidence needed` and use a syntactically valid placeholder tag (for example `postgres:MAJOR`, which keeps `docker compose config` parseable); do not invent a concrete version tag.

## Decision Checklist

Decide each item explicitly. Every item resolves to a concrete value or an `unknown` carried into `### Evidence needed`.

1. `base-image-selection`: choose an official or policy-approved base for the resolved runtime. Prefer the slim/bookworm-style variant a developer can still install tooling into over a fully locked-down production base.
2. `base-image-pinning`: pin the base to the most specific tag the evidence supports (major when only a major is known; minor when a minor is known), plus a digest when a registry policy requires it. Never `latest`. Tightening below the evidence-supported level is an `### Evidence needed` item, not an invented value.
3. `runtime-version`: pin from the most authoritative runtime-version signal found (version-pin file such as `.nvmrc`/`.tool-versions`/`.python-version` > manifest version directive such as `engines`/`rust-version`/the `go` line > CI/toolchain version files). Lockfiles pin dependency versions, not the runtime, so they are not a runtime-version signal. If sources disagree, the pin file wins and the conflict is a note.
4. `build-layout`: order layers so dependency installation is cached independently of source: copy manifests and lockfiles, install dependencies, then copy source. Use a multi-stage build only when the dev image genuinely benefits (compiled toolchain vs. slim runtime); otherwise a single dev stage is simpler and correct.
5. `dependency-install`: use the lockfile-respecting, reproducible install command for the detected package manager (`npm ci`, `pip install -r` with hashes or `poetry install`, `go mod download`, `cargo fetch`, `composer install`), not an unpinned upgrade command.
6. `dev-affordances`: include dev dependencies, a working shell, and the project's watch/reload entrypoint. Document the expected source bind mount and the run command (or defer them to `compose.yaml`). When the source bind mount covers the directory where dependencies are installed in-tree (for example `node_modules`, an in-project `.venv`, or `vendor/`), add a separate volume for that subpath so the mount does not shadow the dependencies installed during the build.
7. `backing-services`: for each service in the spec's data flow, add a `compose.yaml` service with a named volume for persistence, a healthcheck, and a development-only default credential. Treat that credential as a secret: keep it development-only and localhost-only, never bake it into the image, and never reuse it on a shared or production host. Pin the image to the tag the evidence supports; when no version is pinned by repo evidence or the spec, use a placeholder tag and add an `### Evidence needed` item rather than inventing one.
8. `ports`: expose only the ports the spec or repo evidence justifies; map them in `compose.yaml`, not hard-coded in the Dockerfile beyond `EXPOSE` documentation.
9. `non-root-user`: create and switch to a non-root user for the final (or only) stage; ensure bind-mounted source and caches remain writable by that user.
10. `healthcheck`: add a `HEALTHCHECK` (or compose-level healthcheck) tied to a real readiness signal when the service exposes one.
11. `dockerignore`: generate or extend `.dockerignore` to exclude VCS metadata, local dependency/build output (`node_modules`, `target`, `dist`, `__pycache__`, `vendor`), env files, and every secret-bearing path found in repo evidence (keys, tokens, credential files such as `*.pem`, `.npmrc`, `.netrc`, `.git-credentials`), before any `COPY`.

## Rules

- Pin every image to the most specific tag the evidence supports; `latest` is never an acceptable resolution. When no version can be resolved, use a syntactically valid placeholder tag (for example `postgres:MAJOR`, not `postgres:<major>`, so `docker compose config` still parses) and record the unresolved version under `### Evidence needed`; never substitute a guessed concrete tag.
- No secrets in the image. Never bake credentials, tokens, private keys, or `.env` contents into `ARG`, `ENV`, or any layer. Secrets enter at runtime via compose `environment`/`env_file` (git-ignored) or mounted files. Build secrets that are unavoidable use BuildKit `--mount=type=secret`, never `ARG`.
- A `.dockerignore` must exist and exclude env files and every repo-specific secret-bearing path (not just `.env*`) before any broad `COPY . .`. Scan repo evidence for secret paths beyond `.env`; a broad copy without a `.dockerignore` that covers the actual secret set is a finding, not an acceptable output.
- The final (or only) stage runs as a non-root user unless a named dev constraint requires root; recommending root without that driver is a finding against the recommendation. This applies to single-stage Dockerfiles too.
- Reproducible installs only: respect the lockfile; an unpinned `install`/`upgrade` that ignores the lockfile is a finding.
- Preserve existing project container files when present: audit and amend rather than silently replacing a working `Dockerfile` or `compose.yaml`; call out what changed and why. If an existing container file conflicts with the resolved stack or version, do not silently amend to match it; surface the conflict under Resolution Notes and let the higher-precedence source decide, recording the override.
- Dev intent is explicit: the output is for development. State where it deliberately differs from a production image (dev dependencies present, source mounted, tooling installed) so it is not shipped to production by accident.
- Every `unknown` (runtime version, service version, port, entrypoint) maps to an `### Evidence needed` entry with the cheapest way to settle it.
- Verification is a build, not a claim: the recommended next step is `docker build` (and `docker compose config` when a compose file is produced). State this seam; do not assert the image works without it.

## Output Format

Return the report below. The fenced `dockerfile`, plain, and `yaml` blocks inside the template are illustrative shapes; replace their contents with the project's resolved values.

~~~markdown
## Dev Container Plan

- Stack: <language + runtime, with the evidence it was derived from>
- Resolved runtime version: <pinned version + source> | unknown
- Target: development (not production-hardened)
- Backing services: <list from spec data flow, or `none`>

### Resolution Notes

- <decision>: <chosen value> — <source per Input Precedence; note any overridden lower-source signal>

### Dockerfile

```dockerfile
# pinned base; never latest
FROM <image>:<pinned-tag>
# working directory shared with the compose bind mount
WORKDIR /app
# copy manifests + lockfile first so the dependency layer caches
COPY <manifests> <lockfile> ./
RUN <lockfile-respecting install>
# copy source after dependencies
COPY . .
# non-root runtime user
USER <non-root-user>
HEALTHCHECK <readiness check, when one exists>
EXPOSE <justified ports>
CMD [<dev entrypoint>]
```

### .dockerignore

```
.git
<dependency/build output, e.g. node_modules, dist, target, __pycache__, vendor>
.env*
<other secrets and local-only files>
```

### compose.yaml

```yaml
services:
  app:
    build: .
    volumes:
      - .:/app                 # source bind mount for hot reload
      - <dep-dir-volume>:/app/<in-tree-dep-dir>  # keep built deps (e.g. node_modules) from being shadowed by the mount; omit if deps install outside the mount
    ports:
      - "<host>:<container>"
    env_file: .env             # git-ignored; never baked into the image
  <service>:
    image: <image>:<pinned-tag>
    volumes:
      - <named-volume>:<data-path>
    healthcheck:
      test: [<readiness probe>]
    environment:
      <DEV_ONLY_CRED>: <value>   # development-only/localhost-only; still a credential, never commit a real one or bake it into the image
volumes:
  <named-volume>:
  <dep-dir-volume>:           # only if an in-tree dependency dir is shadowed by the source mount
```

Omit the `compose.yaml` section only when there are no backing services and no dev orchestration is needed; say so on the Backing services line.

### Evidence needed

- <unknown>: <cheapest way to settle it (read a version-pin file, ask for the target version, check the service's release notes)>

### Build And Run

- Resolve first: replace every placeholder tag and settle the `### Evidence needed` items before running; `docker compose up` will fail to pull a placeholder like `postgres:MAJOR` even though `docker compose config` parses it.
- Build: `docker build ...` | `docker compose build`
- Run (after resolving placeholders): `docker compose up` | `docker run ...`
- Verify: `docker build` succeeds and `docker compose config` is valid

### Deviations From Production

- <dev affordance present here that a production image must not ship>
- Dev-only credentials and exposed ports are localhost-only; do not use the generated `compose.yaml` on shared or staging hosts.
~~~

Empty sections are written with `None`, except `compose.yaml`, which is the one section omitted entirely when no backing services or dev orchestration are needed (per the note above). `Verdict: BLOCK` appears only in the insufficient-input template below.

## Error Handling (BLOCK Template)

Use this reduced template only for missing or unreadable input.

~~~markdown
## Dev Container Plan

Verdict: BLOCK

- Missing input: <no stack derivable from the request, repository evidence, or the spec / manifests unreadable>
- Smallest addition to proceed: <name the runtime, or point to a manifest/lockfile>
~~~

## Example

Spec: a small HTTP service that reads from Postgres. Repo evidence: `package.json` with `"engines": { "node": ">=22 <23" }`, `package-lock.json` present, no existing Dockerfile.

- `runtime-version` resolves to Node `22` from the `engines` directive in `package.json`; base image `node:22-bookworm-slim`, pinned to the major the evidence supports, not `latest`. Tightening to a specific minor or digest is an `### Evidence needed` item, not an invented value.
- `dependency-install` uses `npm ci` to respect `package-lock.json` (install reproducibility only, not a runtime-version signal), copied before source so the dependency layer caches.
- Postgres appears in the data flow with no pinned version → a `compose.yaml` `db` service using a syntactically valid placeholder tag `postgres:MAJOR` with a named volume, a healthcheck, and `POSTGRES_PASSWORD` marked development-only; the unresolved version is surfaced under `### Evidence needed` as "confirm Postgres major with the team" rather than inventing a tag.
- `.dockerignore` excludes `node_modules`, `.git`, `.env*`, and `dist` before `COPY`.
- Runtime stage adds a non-root `node` user; source is bind-mounted in compose for hot reload.
- `### Deviations From Production`: dev dependencies installed and source mounted — a production image would use `npm ci --omit=dev` and copy a built artifact instead.

## Anti-Patterns

- `FROM node:latest` or any unpinned base — the build is not reproducible.
- Secrets baked into `ARG`/`ENV` or copied via `.env` into a layer.
- `COPY . .` with no `.dockerignore`, dragging `node_modules`, `.git`, and secrets into the image.
- Running as root with no constraint requiring it.
- `npm install`/`pip install` ignoring the lockfile, so the container drifts from the project.
- Copying source before installing dependencies, busting the dependency cache on every code change.
- Bind-mounting the source over an in-tree dependency directory (`node_modules`, in-project `.venv`, `vendor/`) so the mount shadows the dependencies installed during the build, leaving the container with no dependencies at runtime.
- Emitting a production-minimized image when the request was a development environment (or vice versa) without saying which target it is.
- Claiming the image works without naming `docker build` as the verification step.
- Inventing a backing-service version tag instead of marking it `unknown`.

## Definition of Done

A single stack is resolved (or multiple detected stacks are surfaced for the user to choose), the runtime version is resolved from named evidence (or marked `unknown` with an evidence step), every base and service image is pinned to the most specific tag the evidence supports, the layer order caches dependencies independently of source, a `.dockerignore` excludes build output and every repo-specific secret path before any broad copy, the final (or only) stage runs non-root unless a constraint requires otherwise, no secret is baked into any layer, each spec-named backing service has a compose entry with a pinned image and healthcheck, every `unknown` maps to an `### Evidence needed` entry, deviations from a production image (including the localhost-only caveat) are stated, and the plan names `docker build`/`docker compose config` as the host-run verification seam.
