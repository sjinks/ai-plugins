---
name: config-surface-map
description: "Use when: mapping a codebase's runtime configuration and deployment-sensitive settings: environment variables, .env files, config files (YAML/TOML/JSON), feature flags, secrets, default values, deployment overrides, Docker/Kubernetes/CI config, config validation, and dangerous or missing defaults. Part of the Code Explorer workflow."
argument-hint: "Repository scope; build/runtime findings if available."
user-invocable: false
---

# Configuration Surface Map

Map all runtime configuration and deployment-sensitive settings so operators and future agents can see what controls behavior and where misconfiguration is dangerous.

Follow the evidence, confidence, and stable-ID rules in the plugin's `shared/exploration-protocol.md` and `shared/stable-id-policy.md`. Output contracts: `15_CONFIG_SURFACE.md` and `machine-readable/config_surface.json` in `shared/output-contracts.md`. The reference files live at the plugin root, sibling of `skills/`. When run standalone, those rules still apply; if a reference is unavailable, stop and report it.

## What to Look For

Environment variables; `.env.example`; config files; YAML/TOML/JSON config; feature flags; secrets; default values; deployment-specific overrides; Docker/Kubernetes/GitHub Actions config; config validation; dangerous defaults; missing required config; hidden config access via `process.env`, `getenv`, `os.environ`, `env(`, etc.

## Procedure

1. Search for config access points (env reads, config loaders, flag checks) and config declaration files.
2. For each config item record: name; kind (`env|file|flag|secret|feature-flag|runtime-option|other`); whether required; default value; what uses it; validation present; risk; evidence; confidence; stable `CONFIG-*` ID.
3. Flag risky items: secrets with insecure defaults, required config with no validation, dangerous defaults (debug on, auth off), and config read in many places (high blast radius).

## Rules

- Never reproduce secret values. Record the presence and location only.
- A config item is `required: true` only with evidence (no default, or a hard failure when unset). Otherwise mark it optional with its default.
- Use `CONFIG-*` IDs per the stable-ID policy; reuse across refreshes for the same key.
- Dangerous defaults and missing validation forward to the risk register.

## Output

Write `15_CONFIG_SURFACE.md` and `machine-readable/config_surface.json` per `shared/output-contracts.md`, with provenance stamps.
