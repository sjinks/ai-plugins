## Spec Readiness
`partial` - Ingestion and severity assignment are ready; the notification flow is blocked.

## Goal
Triage incoming WordPress plugin vulnerability reports and notify on critical findings.

## User Stories
- US-1 As a security analyst, I want incoming reports queued, so that I can triage them.
- US-2 As a security analyst, I want to assign severity, so that critical issues are prioritized.

## Functional Requirements
- FR-1 MUST ingest vulnerability reports from the configured source.
- FR-2 MUST let an analyst assign a severity (low/medium/high/critical).
(Notification-on-critical is blocked and kept unnumbered in Open Questions.)

## Non-Functional Requirements
- NFR-1 MUST process a single report in under 2 seconds.

## Interfaces And Data Shapes
- INT-1 Report record: { plugin_slug, version, cve_id?, source, received_at }.

## Acceptance Criteria
- AC-1 verifies FR-1: a report on the source appears in the triage queue.
- AC-2 verifies FR-2: an analyst can set and persist a severity value.
- AC-3 verifies FR-1: a duplicate report is de-duplicated by (plugin_slug, cve_id).
- AC-4 verifies NFR-1: a single report is processed in under 2 seconds.
- AC-5 verifies FR-2: an invalid severity value is rejected.

## Edge Cases And Error Scenarios
- EDGE-1 MUST-handle a malformed report payload by rejecting it and logging the reason.

## Open Questions
- Notify a channel when a report is marked critical: which channel (email, Slack,
  webhook) should fire? Blocked and unnumbered until the channel is chosen.
