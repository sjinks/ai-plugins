# ai-plugins

A collection of AI plugins for different agent workflows. Each plugin is self-contained and ships its own README and skills or agents.

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
- [specification-skills](specification-skills/README.md) — requirements and specification workflow skills for clarifying scope, assumptions, and edge cases.

## Marketplace

Marketplace catalogs:

- GitHub Copilot: [.github/plugin/marketplace.json](.github/plugin/marketplace.json).
- Codex: [.agents/plugins/marketplace.json](.agents/plugins/marketplace.json).
- Cursor: [.cursor-plugin/marketplace.json](.cursor-plugin/marketplace.json).
- Claude Code: [.claude-plugin/marketplace.json](.claude-plugin/marketplace.json).

The catalogs target different hosts and list different package sets. Root `plugin.json` files use Agent Plugins 1.0 metadata; shared `skills/` are the portable components. Custom `agents/*.agent.md` workflows require a host or adapter that supports their agent format and tools. A valid manifest alone does not register those agents or certify runtime compatibility.

The Codex, Cursor, and Claude Code catalogs list the five skills-only packages: `architecture-skills`, `commit-discipline-skills`, `instructions-authoring`, `review-skills`, and `specification-skills`.

### Cursor

Import `https://github.com/sjinks/ai-plugins` in Cursor's Customize view using **From GitHub Repository**, then install the desired plugins. The repository catalog supplies the package paths; the skills remain in each package's `skills/` directory. See the [Cursor skills documentation](https://cursor.com/docs/skills).

### Claude Code

Register the repository marketplace and install a package, for example:

```bash
claude plugin marketplace add sjinks/ai-plugins
claude plugin install architecture-skills@ai-plugins
```

Claude Code discovers the default `skills/` layout using the marketplace entries, so these packages do not need duplicate `.claude-plugin/plugin.json` manifests. See the [Claude Code marketplace guide](https://code.claude.com/docs/en/plugin-marketplaces) and [manifest reference](https://code.claude.com/docs/en/plugins-reference). Host loading and model behavior require validation in the target client.
