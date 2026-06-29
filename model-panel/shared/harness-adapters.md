# Harness Adapter Reference

This reference defines how Model Panel reasons about host-specific model and agent routing. It is a local reference, not an invocable skill.

## Adapter Modes

### Direct Model-Selecting Agent Invocation

Use this mode when the host can invoke a named target agent and set the model route for that invocation. This is the preferred mode because it preserves the target agent and task packet while changing only the model route.

Required evidence:

- target agent name accepted by the host;
- requested model label accepted by the host;
- read-only capability evidence showing mutating tools are absent, disabled, or sandboxed for the target invocation on every route;
- invocation result returned with status and raw output;
- actual model label recorded when exposed by the host.

### Fixed-Model Alias Agents

Use this mode only when the user supplies or confirms separate agent aliases that are known to run the same target task under different fixed models. The Coordinator must still send the same canonical task packet to every alias.

This mode is less clean than direct model selection because the agent wrapper may contain hidden behavioral differences. Fixed-model alias agents are `partial` unless alias definitions, route evidence, read-only capability evidence, and canonical packet evidence prove no material wrapper differences. Record the limitation or the proof in the report.

### Manual Run Packets

Use this mode when the host cannot programmatically select models, cannot invoke arbitrary target agents, or cannot prove the requested model route. Emit one manual packet per requested model and mark the panel `blocked` or `partial` according to `shared/run-contract.md`.

Manual packets are not evidence that the runs completed.

## Copilot And VS Code Notes

- Copilot-style hosts may expose subagent invocation plus a model selector. When available, use direct model-selecting invocation and record the actual model label if the host returns it.
- VS Code custom agent prompts may run under the currently selected conversation model and may not be able to switch models from inside the prompt. In that case, emit manual packets or ask the user to run the same packet after switching models.
- If a host supports arbitrary agent names but not every requested model name, use `partial` only when at least one requested route actually ran or has supplied raw output. If no requested route can be run or verified, return `blocked` and report the exact unsupported labels.
- If a host supports model names but only for a fixed list of declared agents, arbitrary-agent routing is unavailable unless the requested target agent is declared or otherwise accepted by the host.

## Feasibility Decision

Use the first matching decision:

1. Direct model-selecting invocation available for target agent and every model route: run the panel.
2. Direct invocation available for some routes: run those routes, mark missing routes `blocked`, and return `partial`.
3. User-supplied fixed-model alias agents available: run aliases only when read-only capability evidence is available, then classify with the fallback status matrix.
4. No reliable model routing: emit manual run packets and return `blocked` unless the user supplied completed raw outputs.
5. User supplied completed raw outputs for each model: skip invocation and run compatibility plus synthesis over those outputs, recording that execution was external.

## Fallback Status Matrix

- Direct routed runs are `completed` only when every requested route succeeds, read-only capability evidence is available, model identity is distinct for at least two routes, canonical packet evidence is retained, and the requested synthesis mode completes.
- Fixed-model alias agents are `partial` unless alias definitions, route evidence, read-only capability evidence, and canonical packet evidence prove no material wrapper differences; with that proof, use the direct-run status rule.
- User-supplied raw outputs can be `completed` only when every requested output is present, each output has model provenance, canonical packet evidence matches every output, at least two distinct actual model identities or routing keys are represented, and the raw-output policy is satisfied.
- Partial external outputs are `partial` when at least one useful output exists. No runnable routes and no useful supplied output is `blocked`.