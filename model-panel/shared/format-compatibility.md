# Format Compatibility Reference

This reference defines how to decide whether arbitrary target-agent outputs can be combined into the same output format. It is a local reference, not an invocable skill.

## Compatibility Status

- `compatible`: successful outputs share a stable enough structure that a combined result can be emitted in the same format without dropping material content.
- `mismatch`: successful outputs use materially different structures or one output cannot be mapped into the inferred format without changing meaning.
- `inconclusive`: outputs are too short, too free-form, too sparse, or too few to prove a shared format.

The Coordinator must test compatibility at runtime. Do not assume compatibility from the fact that every run used the same target agent.

Format compatibility is a runtime invariant to test, not an assumption.

## Structural Checks

Apply the strongest check that fits the outputs:

- JSON: parse every output as JSON and compare top-level type plus required key set. For arrays, compare item shape when obvious.
- JSON: for material fields, also compare nested object shape, array item schema, required versus optional keys, scalar types, discriminator or enum-like values, and nullability. Treat unvalidated nested material differences as `inconclusive`.
- YAML or frontmatter-like data: compare key set, nested object shape, required versus optional keys, scalar types, list item shape, and discriminator or enum-like values when parseable or visually unambiguous.
- Markdown: compare heading tree, required section labels, table headers, repeated item structure, required field labels, and whether material sections can represent provenance and disagreements without distorting meaning.
- Tables: compare column headers, row semantics, required columns, repeated-row meaning, and whether a row from each output can be merged without changing the row's subject or evidence basis.
- Plain text: treat as `inconclusive` unless all outputs visibly follow the same labeled paragraphs or list pattern.
- Error or refusal outputs: compatible only with other error/refusal outputs of the same class; otherwise they are route failures or limitations, not peer content.

## Format-Preserving Synthesis Gate

Format-preserving synthesis is allowed only when all of these are true:

- at least two successful outputs exist;
- compatibility status is `compatible`;
- material fields or sections can be preserved in the inferred format;
- material nested fields, required fields, row semantics, and repeated item schemas have been compared deeply enough for the inferred format;
- disagreements can be represented without hiding a model's position;
- raw outputs are retained elsewhere in the report or by artifact reference.

If any condition fails and synthesis mode is `auto`, use evidence-preserving summary. If synthesis mode is `format-preserving`, return `partial` or `blocked` with the failed gate.

## Mismatch Handling

For `mismatch` or `inconclusive` outputs:

- do not force a combined answer into one model's format;
- report the apparent structure of each output;
- summarize agreements, unique claims, and disagreements with model provenance;
- include raw outputs or artifact references;
- name the exact compatibility gate that failed.