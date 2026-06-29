# Planning Forge Metamodel Fixtures

These fixtures exercise the machine-readable Planning Forge metamodel. They are intentionally small and validate schema shape, stable-ID/type consistency, and typed traceability edges.

Run from the repository root:

```sh
node dev/planning-forge/scripts/validate-metamodel.mjs dev/planning-forge/fixtures/metamodel/minimal-planning-bundle.json
node dev/planning-forge/scripts/test-metamodel-validator.mjs
```