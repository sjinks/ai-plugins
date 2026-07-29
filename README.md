# ai-plugins

A collection of AI plugins for different agent workflows. Each plugin is self-contained and ships its own README, manifest, and skills or agents.

## Plugins

- [architecture-skills](architecture-skills/README.md) — architecture and design workflow skills for decisions, tradeoffs, contracts, failure modes, and type-safe designs.
- [code-explorer](code-explorer/README.md) — deep codebase exploration agents and skills for evidence-based repository mapping.
- [code-smith](code-smith/README.md) — execution-phase agents for implementing approved plans and running verification.
- [instructions-authoring](instructions-authoring/README.md) — instruction-authoring skills for cross-model prompt design, package auditing, and instruction quality review.
- [commit-discipline-skills](commit-discipline-skills/README.md) — commit and pull request discipline skills for review-ready branch hygiene and descriptions.
- [model-panel](model-panel/README.md) — multi-model orchestration for running the same agent task through multiple model routes.
- [planning-forge](planning-forge/README.md) — planning workflow agents for specification, architecture, test planning, and publishing.
- [review-forge](review-forge/README.md) — multi-lens review workflow agents for evidence-based code review.
- [review-skills](review-skills/README.md) — review workflow skills for scoping, findings quality, fix planning, and merge gating.
- [shell-safety](shell-safety/README.md) — dangerous shell command patterns and safe rewrites for AI agents.
- [specification-skills](specification-skills/README.md) — requirements and specification workflow skills for clarifying scope, assumptions, and edge cases.

## Marketplace

The repository marketplace manifest lives at [.github/plugin/marketplace.json](.github/plugin/marketplace.json).