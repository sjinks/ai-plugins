# Single-Pass Review Reference

This reference defines Review Forge's completeness discipline. It is a local reference, not an invocable skill.

## Rule

Each selected lens should make one complete pass over the in-scope diff for that lens before returning findings. Do not drip-feed obvious findings across multiple rounds.

## Procedure

1. Name the dimensions the lens will review.
2. Sweep the whole in-scope diff for those dimensions.
3. Record coverage and excluded areas.
4. Report all material findings found in that pass.
5. Put unreviewed dimensions in Limitations, not in Findings.

## No-Findings Case

If no findings are found, still report dimensions reviewed, coverage, limitations, and residual risk. Do not imply the whole change is risk-free unless the lens actually reviewed the whole requested scope.

## Re-Review Rule

In later review rounds, focus on changed or newly supplied material and previously unresolved findings. Do not re-open unchanged code unless the new change exposes a direct regression.
