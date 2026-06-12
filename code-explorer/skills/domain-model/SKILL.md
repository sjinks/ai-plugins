---
name: domain-model
description: "Use when: extracting the domain model during deep codebase exploration: entities, value objects, DTOs, schemas, events, commands, roles, relationships, invariants, lifecycle/state transitions, and naming inconsistencies. Phase 5 of the Code Explorer workflow."
argument-hint: "Repository scope; entrypoint and architecture findings if available."
user-invocable: true
---

# Domain Model Extraction

Understand the concepts the system is built around. This is Phase 5 of the Code Explorer workflow; entrypoint inputs/outputs (Phase 4) are a primary source of domain nouns.

Follow the evidence and confidence rules in the plugin's `shared/exploration-protocol.md`. Output contract: `05_DOMAIN_MODEL.md` in `shared/output-contracts.md`. Both files live at the plugin root, sibling of `skills/`. When run standalone, those rules still apply; if either reference is unavailable, stop and report it. When Phase 4 artifacts are unavailable, derive domain nouns directly from schemas, migrations, and type definitions, and note the missing input under `Limitations`.

## Tasks

1. Identify domain nouns: entities; value objects; DTOs; schemas; database tables; events; commands; policies; roles; permissions; external concepts (third-party objects the system mirrors).
2. Identify relationships between domain concepts (ownership, reference, composition, event production/consumption).
3. Identify lifecycle/state transitions: status enums, state machines, workflow steps.
4. Identify invariants and where each is enforced (constructor, validator, database constraint, test).
5. Identify naming inconsistencies: the same concept under different names, or one name for different concepts.
6. Identify unclear concepts and record them as open questions.

## Sources

In evidence order: database schemas and migrations; type/class definitions; validation schemas (JSON Schema, zod, DTO annotations); API specs (OpenAPI/GraphQL); test fixtures; documentation. Schemas and migrations outrank prose docs when they disagree — record the disagreement.

## Rules

- Every concept row needs `Represented by` (concrete file/symbol/table) and evidence. Concepts without code representation are `Low` confidence external concepts. Example row: `| Order | A customer purchase | src/models/Order.ts, table orders | migration 003_orders.sql | High |`.
- An invariant is `High` confidence only when you can point at the enforcing code or constraint. A commented intention is not enforcement.
- The Mermaid `classDiagram` shows core concepts and relationships only — cap at ~15 classes; relegate the rest to the table.
- Naming inconsistencies are findings with both names and both locations cited.

## Output

Write `05_DOMAIN_MODEL.md` per `shared/output-contracts.md`, with a provenance stamp. Unclear concepts go to `Open domain questions` and forward to the consolidated open-questions artifact.
