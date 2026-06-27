# Planning Self-Review Reference

This reference defines a lightweight adversarial self-review pass for Planning Forge agents. It is a local reference, not an invocable skill.

Use it before returning a planning artifact. Fold fixes into the agent's normal output sections. Do not emit a separate review report unless the user explicitly asks for one.

## Universal Questions

- What could a downstream builder, planner, tester, or publisher misinterpret?
- What requirement, decision, test, verdict, or document change is unsupported by evidence?
- What failure mode, edge case, or sensitive-data risk was not routed to a requirement, decision, test, risk, gap, or open question?
- What scope change is hidden as an assumption?
- What verification claim is not observable through the selected seam, command, manual review, or documented invariant?
- What artifact should be split, blocked, or marked partial instead of treated as ready?
- What volatile literal (test count, allocation/throughput figure, file count) is baked into prose where it will rot? Prefer "the full suite" or one pinned baseline section.
- What cross-reference uses a hardcoded file path that would break on a rename or merge? Prefer a stable role reference ("the source specification") or a doc ID.
- When the artifact claims to reflect current source, was it reconciled against the live tree (extensions, names, dependencies, enumerators) rather than copied from a prior artifact?

## Specification Checks

- Scope is explicit, and broad work is decomposed or marked partial/blocked.
- FRs, NFRs, interfaces, ACs, edge cases, assumptions, open questions, and tasks agree with each other.
- ACs are observable or explicitly marked manual/review/judgment items.
- Assumptions are modest and do not hide decisions that change behavior, interfaces, sequencing, or verification.
- Implementation tasks trace to ready requirements and ACs.

## Architecture Checks

- Design decisions do not smuggle in product scope changes.
- Interfaces, state transitions, errors, security/privacy, observability, rollout, and verification seams are concrete enough for a builder.
- Alternatives are real tradeoffs, not filler.
- Risks have mitigations and residual-risk notes.
- Scope amendments are explicit when the design needs a spec change.

## Test Plan Checks

- Every must-have AC, edge case, failure mode, and named risk is covered by a test, manual/review rationale, or coverage gap.
- Assertions target behavior and contracts, not incidental implementation details.
- Fixtures are synthetic, deterministic, non-sensitive, and include cleanup needs when relevant.
- Recommended commands are supported by repository evidence or marked assumption-based/unknown.

## Prototype Checks

- The prototype answers one named question and has explicit decision criteria.
- Evidence supports the verdict; inconclusive results are labeled as such.
- Throwaway artifacts are clearly marked and have a cleanup or absorption path.
- Durable findings are separable from prototype code.

## Publishing Checks

- The saved document preserves planning substance and IDs.
- The target path stays inside the requested documentation area.
- Existing unrelated content is preserved.
- Sensitive content is redacted or blocked.
- Index updates improve discoverability and do not create stale links.

## Anti-Patterns

- Do not turn self-review into a separate deliverable by default.
- Do not add speculative risks just to fill sections.
- Do not fix issues by expanding scope beyond the current user request.
- Do not mark an artifact ready when consequential uncertainty remains unresolved.