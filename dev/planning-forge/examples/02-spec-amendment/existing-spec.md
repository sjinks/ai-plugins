## Spec Readiness
`partial` - Core triage flow is ready; notification channel is blocked on an open question.

## Goal
Triage incoming WordPress plugin vulnerability reports and record a severity decision.

## User Stories
- US-1 As a security analyst, I want to see incoming vulnerability reports, so that I can triage them.

## Functional Requirements
- FR-1 MUST ingest vulnerability reports from the configured source.
- FR-2 MUST let an analyst assign a severity (low/medium/high/critical).

## Non-Functional Requirements
- NFR-1 MUST process a single report in under 2 seconds.

## Interfaces And Data Shapes
- INT-1 Report record: { plugin_slug, version, cve_id?, source, received_at }.

## Acceptance Criteria
- AC-1 Given a report on the source, when ingestion runs, then the report appears in the triage queue. Trace: FR-1 demonstrated_by AC-1.

## Edge Cases And Error Scenarios
- EDGE-1 MUST-handle a malformed report payload by rejecting it and logging the reason.

## Assumptions
- ASM-1 Reports arrive one at a time, not in bulk.

## Open Questions
- Which notification channel (email, Slack, webhook) should fire when a report is marked critical?
