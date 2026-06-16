# Expected Report Shape

## Review Status
`no-go` - Security found an open high-severity SQL injection finding.

## Inputs
- target: raw-diff; diff source: supplied; changed files: `src/example.js`; upstream artifacts: absent.

## Lenses Run
- security: completed; reviewed SQL/query construction in changed hunk.
- contextual, independent, performance, adversarial, test-adequacy: completed or partial with stated limitations.

## Findings
- id: `RF-security-1`; lens: security; severity: high; title: SQL query concatenates untrusted `id`; evidence anchor: `src/example.js` added query line; risk category: security; risk: attacker-controlled input can alter SQL; expected fix: use a parameterized query; acceptance condition: query uses bound parameters and tests cover malicious input; trace IDs: None; confidence: high; residual risk: None; fingerprint: security|src/example.js|sql-injection|query-concatenates-id; status: open

## Cross-Lens Conflicts
- None - no conflicts.

## Recommendation
- no-go until `RF-security-1` is fixed or a named owner explicitly accepts the risk.

## Limitations
- No upstream specification or test plan supplied.

## Residual Risk
- SQL validation outside the changed hunk was not reviewed.

## Deferred
- Posting comments, resolving threads, editing code, committing, pushing, and deploying are out of scope for Review Forge v1.
