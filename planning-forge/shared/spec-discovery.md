# Specification Discovery Reference

This reference adds lightweight discovery checks for specification planning. It is a local reference, not an invocable skill.

Use it when the Specification Planner needs repository-grounded scope, comparative candidate discovery, or acceptance-criteria feasibility checks. Do not replace the Specification Planner output format.

## Multi-Artifact Scope Check

Use this check when a task touches multiple files or artifacts of the same kind, such as commands, agents, skills, templates, pages, services, migrations, routes, tests, or configuration files.

- Verify the live file set before fixing scope in the specification.
- Use repository search/listing to count or enumerate matching artifacts.
- Record the count, representative paths, or search limitation in `Inputs From Upstream Context`.
- If user-supplied counts or prior planning artifacts conflict with the live filesystem, keep the live filesystem as evidence and record the conflict in Open Questions or Assumptions according to consequence.

Do not rely on memory, old PRDs, issue text, or prior assistant summaries for final artifact counts.

## Comparative Candidate Re-Read

Use this check for comparative research or candidate-selection tasks, such as choosing a framework, dependency, storage layer, API, migration strategy, or implementation approach.

- Re-read user-supplied files, URLs, notes, and prior artifacts before finalizing the candidate list.
- Cross-check the final list against those sources.
- Record omitted candidates only when there is a concrete reason, such as out-of-scope, unsupported, duplicate, incompatible, or unavailable.

Do not build a final candidate list from memory alone when the user supplied source material.

## Acceptance-Criteria Feasibility Check

Use this check before finalizing measurable acceptance criteria.

- Check whether each measurable AC can be observed through available repository commands, files, test seams, public interfaces, manual review paths, or documented invariants.
- If a command, file, route, test seam, or environment is required, verify by repository inspection that the specification can name it or explain why it remains builder-discovered.
- If an AC cannot currently be executed or observed, reformulate it as a manual/review criterion, add a coverage note in `Traceability And Coverage`, or record a blocker in Open Questions.
- Do not promise `exit 0`, passing builds, deployed behavior, or exact file paths unless repository evidence supports that verification path.
- Do not run commands from this reference. Use read/search/web evidence unless the active agent separately has execution tools and the current user explicitly asked for command execution.

Acceptance criteria should be testable or explicitly marked as judgment/manual items; they should not require an unavailable operating model.

## Anti-Patterns

- Do not run broad discovery when the task scope is already narrow and conversation-only planning is sufficient.
- Do not ask the user for facts that targeted repository inspection can answer.
- Do not turn repository implementation details into product requirements unless they affect public behavior, compatibility, task boundaries, or verification.
- Do not expand scope by adding every related artifact discovered during live search.