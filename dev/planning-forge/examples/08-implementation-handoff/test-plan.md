## Test Contract Status
`ready` - ACs plus architecture seams are present to produce concrete test cases.

## Test Cases
- TC-1 (must, integration, ingestion seam): a report on the source appears in the
  triage queue. Trace: AC-1 verified_by TC-1; FR-1 verified_by TC-1; D-2 verified_by TC-1.
- TC-2 (must, unit, severity service): a valid severity is set and persisted.
  Trace: AC-2 verified_by TC-2; FR-2 verified_by TC-2.
- TC-3 (must, unit, severity service): an invalid severity is rejected.
  Trace: AC-3 verified_by TC-3; FR-2 verified_by TC-3.
- TC-4 (must, unit, ingestion boundary): a malformed payload is rejected and logged.
  Trace: EDGE-1 verified_by TC-4; D-3 verified_by TC-4.

## Coverage Gaps
- None.
