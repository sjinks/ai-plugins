# Multi-Model Review Panel Reference

This reference defines review-specific preparation for Model Panel. It is a local reference, not an invocable skill.

## Review Input Fields

- `review target`: diff, branch/range, changed files, supplied PR context, implementation artifact, or pasted code.
- `target review agent`: the review agent to run for every model route.
- `models`: two or more model labels or routes.
- `review context`: requirements, architecture, test reports, prior review comments, or constraints to pass unchanged to every run.
- `review dimensions`: correctness, security, performance, tests, maintainability, adversarial edge cases, or user-selected dimensions.
- `synthesis mode`: default `auto`.

If the `review target` is missing, ask one concise clarification question when interactive clarification is available. If clarification is unavailable, return `blocked` with the missing review target and, when possible, a reusable handoff template.

## Target Review Agent Selection

If the user names a target review agent, use that exact agent name unless it is `Multi-Model Review Panel` or `Model Panel Coordinator`. If the user does not name one, prefer a non-wrapper review agent already established in the conversation. If the host clearly exposes `Review Forge Coordinator`, it is a reasonable default because it already performs a multi-lens read-only review. Otherwise ask for the target review agent or emit a Model Panel Coordinator handoff.

Do not invent a new reviewer name, do not select `Multi-Model Review Panel` or `Model Panel Coordinator` as the target review agent, and do not assume every installed environment has Review Forge.

## Canonical Review Packet

The review packet sent to Model Panel should contain:

```markdown
Target review agent: <agent name>

Review task:
Review the supplied target and return your normal review output. Preserve your normal output format unless the user supplied an explicit output contract.

Review target:
<diff, paths, branch/range, PR context, or artifact>

Context and constraints:
<same context for every model route>

Requested dimensions:
<dimensions supplied by the user, or `None supplied; target review agent uses its normal review scope`>
```

The same canonical review packet must be used for every model route.

## Review Synthesis Notes

- If the target review agent emits findings with IDs, preserve those IDs and model provenance.
- If multiple models report the same issue, deduplicate only when evidence and expected fix match.
- If one model reports a high-impact issue and others do not, keep it as a unique claim with confidence rather than dropping it.
- If severities differ, retain the highest reported severity and record the disagreement.
- If target review outputs are structurally incompatible, use evidence-preserving summary and include raw outputs.