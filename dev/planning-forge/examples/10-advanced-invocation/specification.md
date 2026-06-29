## Spec Readiness
`ready` - Ingestion and severity assignment are fully specified with no blocking questions.

## Goal
Triage incoming WordPress plugin vulnerability reports and assign severity.

## Functional Requirements
- FR-1 MUST ingest vulnerability reports from the configured source.
- FR-2 MUST let an analyst assign a severity (low/medium/high/critical).

## Non-Functional Requirements
- NFR-1 MUST process a single report in under 2 seconds.

## Interfaces And Data Shapes
- INT-1 Report record: { plugin_slug, version, cve_id?, source, received_at }.

## Acceptance Criteria
- AC-1 a report on the source appears in the triage queue. Trace: FR-1 demonstrated_by AC-1.
- AC-2 an analyst can set and persist a severity value. Trace: FR-2 demonstrated_by AC-2.

## Edge Cases And Error Scenarios
- EDGE-1 MUST-handle a malformed report payload by rejecting it and logging the reason.
