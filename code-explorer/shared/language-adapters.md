# Language Adapter Notes Reference

Per-language tooling hints for the cartography, build/runtime, symbol-inventory, and dependency-graph skills. It is a local reference, not an invocable skill. Use a tool only when it is already installed (verify with the environment's command capability); never install one. When no tool is available, fall back to best-effort search and record the limitation.

## TypeScript / JavaScript

- Manifests: `package.json`, lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`).
- Types/build: `tsc --noEmit` for type errors; `tsconfig.json` for paths.
- Dependency graph: `madge`, `dependency-cruiser`.
- Tests: `jest`, `vitest`, `node --test`, `mocha`.
- Symbols: TypeScript compiler API, `ctags`, or language-aware search.

## PHP

- Manifests: `composer.json`, `composer.lock`; autoload map under `vendor/composer/`.
- Static analysis: Psalm (`psalm.xml`), PHPStan (`phpstan.neon`).
- Dependency graph: Composer autoload map; `nikic/php-parser`-based tools.
- Tests: PHPUnit (`phpunit.xml`).

## C / C++

- Build: `CMakeLists.txt`, `Makefile`; compile commands in `compile_commands.json`.
- Symbols/graph: clangd, `clang-query`, include-graph tools, CMake target graph.
- Tests: CTest, GoogleTest, Catch2.

## Go

- Manifests: `go.mod`, `go.sum`.
- Graph/build: `go list -deps`, `go vet`.
- Tests: `go test`.

## Rust

- Manifests: `Cargo.toml`, `Cargo.lock`.
- Graph/metadata: `cargo metadata` (read-only); `cargo clippy` and `cargo test` compile, so run them only under `write-docs-tests-approved`.

## Churn / change-frequency (any language with Git)

When Git history is available, compute change-frequency hotspots cheaply and cross them with fan-in (read-only):

```bash
git log --pretty=format: --name-only --since="12 months ago" \
  | grep -v '^$' | sort | uniq -c | sort -rn | head -30
```

A file that is both high-churn and high-fan-in is a strong "dangerous to change" signal for the dependency-graph hotspots and the change-impact guide. Record churn numbers as evidence, not as conclusions.
