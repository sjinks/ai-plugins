# Prototype Spike Reference

This reference gives branch-specific guidance for throwaway prototypes and spikes. It is a local reference, not an invocable skill.

Use it when the Prototype Spike agent will create or edit prototype artifacts. Do not use it to turn prototype code into production implementation.

## Universal Rules

- Answer exactly one concrete question. Write the question and decision criteria in the prototype file, README, or adjacent note before building.
- Keep the artifact obviously throwaway. Use names containing `prototype`, `spike`, `throwaway`, or `scratch`, and include `PROTOTYPE - throwaway validation artifact`.
- Put the artifact near the code or docs it informs when a repository exists. Do not invent a new top-level structure when a local convention exists.
- Provide one command, URL, or interaction path to run or inspect it. If the command would mutate package scripts or dependency files, get explicit approval first.
- Keep state in memory by default. Use scratch persistence only when persistence itself is the question.
- Skip polish. Add only the error handling needed to make the prototype runnable and interpretable.
- Surface the relevant state, result, or selected variant after each action, case, or switch.
- Capture the durable answer separately from the throwaway code, then recommend deleting the artifact or absorbing the validated decision into planned production work.

## Branch Selection

Choose one primary branch before editing:

- **`logic-state`**: use when the question is about business logic, state transitions, data shape, API ergonomics, event ordering, lifecycle behavior, or whether a model handles edge cases.
- **`dependency-compatibility`**: use when the question is about parser behavior, library choice, protocol compliance, platform/compiler support, package constraints, performance feasibility, or external standards.
- **`ui-variation`**: use when the question is about visual structure, interaction design, layout, information hierarchy, or comparing multiple UI directions.

If the branch is ambiguous and the user is available, ask one clarifying question. If not, choose the branch that best matches the nearby repository context and state the assumption.

## Logic-State Branch

- Prefer a tiny interactive terminal app or focused harness that lets the user push the model through hard cases by hand.
- Keep the core logic separate from the terminal shell. The shell is throwaway; the validated reducer, state machine, pure function set, or small state-owning module is the only part that may be worth absorbing later.
- Pick the lightest logic shape that fits the question:
  - Pure reducer for discrete actions over a single state value.
  - Explicit state machine when legal transitions matter.
  - Pure functions over plain data when there is no ongoing current state.
  - Small module or class only when the logic genuinely owns internal state.
- Do not let terminal I/O, prompts, printing, or logging drive the core logic.
- Render the full relevant state after each action. Prefer one stable view that replaces the previous frame over endless scrollback.
- Use in-memory fixtures and synthetic data. Do not connect to a real database unless persistence behavior is the exact question and the user approved the scratch target.

## Dependency-Compatibility Branch

- Build the smallest harness that exercises the dependency, parser, protocol, standard, platform, or performance question.
- Define pass/fail cases before running the harness.
- Use synthetic fixtures that cover the important boundary cases: valid, invalid, empty, missing, malformed, unknown, large-enough, incompatible, and edge-order inputs when relevant.
- Record dependency versions, runtime versions, public documentation provenance, and commands used when they affect the verdict.
- Do not install dependencies, mutate package files, contact external services, or run broad benchmarks unless the user explicitly approves the exact action and cleanup expectations.

## UI-Variation Branch

- Prefer embedding variants in an existing page, route, or component context. Existing shell, navigation, auth, data density, and layout constraints make the comparison more realistic.
- Create a new throwaway route only when there is no plausible existing surface to host the variants.
- Default to 3 variants. Use fewer when the tradeoff is narrow; cap at 5 because more usually adds noise.
- Make variants structurally different: layout, hierarchy, primary action, density, navigation, or interaction model should differ. Color or copy-only changes are not enough.
- Keep real data fetching and read paths when safe, but do not wire prototype UI to real mutations. Use stubs or local state for actions unless mutation behavior is the question.
- Prefer a URL-stable selector such as `?variant=` when the framework makes that natural, so variants are shareable and reload-stable.
- If adding a switcher, make it visibly separate from the design under evaluation and prevent it from shipping in production builds.
- After the decision, delete losing variants and switchers. Promote the chosen design through normal production implementation, not by blindly shipping prototype code.

## Handoff And Cleanup

- The durable finding should name the question, setup, evidence, verdict, confidence, and what should be absorbed or deleted.
- If the user is present, ask what the prototype taught them before finalizing the durable finding.
- If the user is not present and the result needs human judgment, leave an explicit unresolved verdict or follow-up question instead of pretending the decision is settled.
- Do not leave prototype artifacts without a cleanup or absorption path.

## Anti-Patterns

- Do not prototype broad features with unclear questions.
- Do not add durable tests, abstractions, production error handling, or polish unrelated to the question.
- Do not share so much UI code between variants that they cannot explore different structures.
- Do not mix core logic with terminal or browser prototype shell code.
- Do not claim dependency suitability without explicit fixtures and evidence.
- Do not treat prototype code as production-ready.