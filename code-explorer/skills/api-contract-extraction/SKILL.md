---
name: api-contract-extraction
description: "Use when: during Code Explorer exploration of a repository or scoped path, mapping the public and semi-public contracts the code must preserve: HTTP routes, OpenAPI/GraphQL/RPC, CLI commands and flags, exported library APIs, queue/event payloads, webhooks, database schemas/migrations, config formats, and serialized data formats. Part of the Code Explorer workflow; not for reviewing an individual diff or change set."
argument-hint: "Repository scope; entrypoints and architecture findings if available."
user-invocable: false
---

# API and Contract Extraction

Identify the public and semi-public contracts that future changes must preserve. Breaking these silently breaks consumers, so they deserve explicit cataloguing.

Follow the evidence, confidence, and stable-ID rules in the plugin's `shared/exploration-protocol.md` and `shared/stable-id-policy.md`. Output contracts: `14_API_AND_CONTRACTS.md` and `machine-readable/contracts.json` in `shared/output-contracts.md`. The reference files live at the plugin root, sibling of `skills/`. When run standalone, those rules still apply; if a reference is unavailable, stop and report it.

## What to Look For

HTTP routes; OpenAPI/Swagger specs; GraphQL schema; RPC methods; CLI commands and flags; exported library APIs; queue/event payloads; webhooks; database schemas and migrations; config file formats; environment variables (as a contract surface); serialized data formats; plugin hooks; extension points.

## Procedure

1. Enumerate contracts by kind from actual declarations (route registrations, schema files, exported symbols, migration files, CLI definitions).
2. For each contract record: kind; name; location; method/path where applicable; inputs; outputs; compatibility concerns; tests; evidence; confidence; stable `CONTRACT-*` ID.
3. Flag compatibility concerns: required fields, response shape, status codes, default values, versioning posture, and anything a consumer would depend on.
4. Cross-reference entrypoints (`ENTRYPOINT-*`) where a contract corresponds to a traced entrypoint.

## Rules

- A contract is only listed with a concrete declaration as evidence; do not infer endpoints that are not registered.
- Prefer the highest-stability surface: a documented OpenAPI route outranks an inferred handler.
- Use `CONTRACT-*` IDs per the stable-ID policy; reuse IDs across refreshes for the same logical contract.
- Record contracts you suspect but cannot confirm under the `## Limitations` section, not as confirmed contracts.

## Output

Write `14_API_AND_CONTRACTS.md` and `machine-readable/contracts.json` per `shared/output-contracts.md`, with provenance stamps. Compatibility-relevant findings forward to the change impact guide and risk register.
