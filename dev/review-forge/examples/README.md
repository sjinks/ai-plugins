# Review Forge Fixtures

These fixtures are static manual-review anchors for Review Forge prompts. They are not executable model tests.

Each fixture has:

- `input.md`
- `expected-report.md`

Run the structural lint with:

```bash
node dev/review-forge/scripts/lint-review-forge.mjs
```
