# Stable ID Policy Reference

This reference defines how Code Explorer assigns identifiers to logical items in artifacts so that IDs stay stable across refreshes. It is a local reference, not an invocable skill. Every skill that emits IDs and the validator follow this policy.

## ID Prefixes

Each logical item kind uses a fixed prefix followed by a zero-padded number of at least three digits:

| Prefix | Item kind | Artifact |
|---|---|---|
| `COMPONENT-001` | Architecture component | `03_ARCHITECTURE_OVERVIEW.md` |
| `ENTRYPOINT-001` | Entrypoint | `entrypoints.json` |
| `FLOW-001` | Data flow | `dataflows.json` |
| `SYMBOL-001` | Symbol (function/class/module) | `symbol_index.json`, `important_functions.json` |
| `CONTRACT-001` | API/contract | `contracts.json` |
| `CONFIG-001` | Config surface item | `config_surface.json` |
| `OBS-001` | Observability signal | `observability_map.json` |
| `SEC-001` | Security-sensitive site | `security_sensitive_code.json` |
| `RISK-001` | Risk | `risks.json` |
| `GAP-001` | Test gap | `test_map.json` (`gaps[]`) |
| `QUESTION-001` | Open question | `open_questions.json` |
| `EVIDENCE-001` | Evidence record | `evidence_index.json` |

## Rules

1. Do not renumber existing IDs during a refresh.
2. Reuse an existing ID when the same logical item still exists, even if its details changed.
3. Mark an item that no longer exists as `status: removed` when it is useful to keep history; otherwise drop it. Active items use `status: active` or omit `status`.
4. Add new IDs only for genuinely new logical items. Allocate the next unused number for that prefix.
5. Do not use file order alone as identity. Two runs over the same repository must produce the same ID for the same logical item.
6. Derive identity from stable properties of the item, not its position:
   - components: name plus primary path;
   - entrypoints: route/method, command name, or exported symbol;
   - flows: entrypoint plus sink;
   - symbols: symbol name plus file;
   - contracts: kind plus route/method/name;
   - config: config key or variable name;
   - observability: area plus signal name;
   - security sites: file plus symbol plus category;
   - risks: risk title plus affected area;
   - gaps: behavior plus area;
   - questions: the question subject.

## Refresh Procedure

When refreshing an existing artifact:

1. Read the existing artifact and build a map from each item's stable identity (per rule 6) to its existing ID.
2. For each item in the new run, look up its identity in that map.
   - Found: reuse the existing ID.
   - Not found: allocate the next unused number for the prefix.
3. For existing IDs whose item is gone, either drop them or mark `status: removed`.
4. Never reassign a retired ID to a different logical item.
