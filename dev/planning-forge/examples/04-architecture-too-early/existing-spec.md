## Spec Readiness
`blocked` - Core authorization, processing model, and failure behavior are undefined.

## Goal
Let a user trigger a re-scan of a WordPress plugin for known vulnerabilities.

## User Stories
- US-1 As a user, I want to trigger a re-scan of a plugin, so that I get current results.

## Functional Requirements
- FR-1 MUST accept a re-scan request for a given plugin slug.

## Acceptance Criteria
- AC-1 verifies FR-1: Given a valid plugin slug, when a re-scan is requested, then a scan job is recorded.

## Open Questions
- Who is allowed to perform a re-scan?
- Should processing be synchronous or asynchronous?
- What is the expected failure behavior when the scan source is unavailable?
