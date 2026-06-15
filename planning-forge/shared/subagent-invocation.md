# Subagent Invocation Reference

This reference defines how the Planning Forge Coordinator invokes specialist agents directly (advanced mode) instead of only emitting a manual handoff prompt. It is a local reference, not an invocable skill.

Advanced mode is optional. The Coordinator must work without it: when the `agent` tool is unavailable, or invocation fails, it falls back to a manual handoff prompt (see `shared/coordinator-routing.md` "Fallback Behavior"). Direct invocation never changes the gating rules — every readiness gate and the no-auto-advance rule still apply.

## When To Invoke Directly

Invoke a specialist via the `agent` tool only when all of these hold:

1. The intent matches that specialist's routing rule (`shared/coordinator-routing.md`).
2. Any gate for that intent has passed, or the user has explicitly overridden it.
3. The `agent` tool is available in the current runtime.
4. The user asked to proceed with this stage in the current message.

If any condition fails, emit the manual handoff prompt instead. Never invoke more than one specialist per user request, and never chain a second stage automatically after the first returns.

## How To Invoke

1. Build the handoff prompt from the matching template in `shared/coordinator-routing.md`. The invoked prompt and the manual fallback prompt must be identical in content.
2. Call the `agent` tool with the exact specialist `name:` (see the routing reference's agent list).
3. Pass only the planning inputs the template requires (request text, existing artifact reference or content, decision criteria, ready slice). Send the template verbatim, including its own Instructions block; do not add extra Coordinator-only instructions, this agent's own prompt text, tool transcripts, or sensitive data on top of the template.

## Relaying Results Back

After a specialist returns:

1. Present the specialist's output to the user without silently editing its substance.
2. Add a compact Coordinator-owned relay summary after the specialist output. Use this shape:

   ```markdown
   ## Specialist Result Summary
   Stage completed: <spec | architecture | test-plan | spike | publish>
   Artifact readiness: <ready | partial | blocked | missing | unknown, with evidence>
   Stable ID changes: <reported ID change summary or None reported>
   Carry-forward items: <open questions, scope amendments, coverage gaps, cleanup or absorb requirements, redactions, skipped writes, failed saves, invocation failures, or None>
   Next recommended action: <one next step; do not auto-advance>
   ```

3. Promote specialist open items into the refreshed planning state. Carry forward unresolved `Open Questions`, `Scope Amendments Requested`, `Coverage Gaps`, prototype `Cleanup / Absorb Path` items, publishing redactions, skipped writes, failed saves, and invocation failures until a later user answer or artifact resolves them.
4. Update the reported planning state (stage, readiness, artifacts, stable-ID changes, blockers, ready slice, and carry-forward items) from the returned content. Read `shared/session-state.md` for the fields to refresh.
5. Recommend the next action, but do not take it. Stop and wait for an explicit user request before invoking any further specialist or advancing the stage.
6. If the specialist returned an ID change summary, surface it; do not renumber or reconcile IDs yourself beyond what the specialist reported.

## Failure Handling

- `agent` tool unavailable or not permitted → emit the manual handoff prompt and say invocation was unavailable.
- Invocation errors or returns nothing usable → report the failure, treat it as a carry-forward item in planning state, emit the manual handoff prompt as fallback, and do not fabricate a result.
- Specialist asks a blocking question → relay it to the user; do not answer on the user's behalf.

## Invariants

- Direct invocation is a convenience, not a new capability: it must not do anything the manual handoff path could not.
- One specialist per request; never auto-advance to the next stage.
- Gates, stable-ID discipline, and sensitive-data rules are unchanged by invocation.
