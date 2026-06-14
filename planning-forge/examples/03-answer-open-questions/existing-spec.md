## Spec Readiness
`blocked` - Core authorization and processing-model questions are unresolved.

## Goal
Let a user trigger a re-scan of a WordPress plugin for known vulnerabilities.

## User Stories
- US-1 As a user, I want to trigger a re-scan of a plugin, so that I get current results.

## Functional Requirements
- FR-1 MUST accept a re-scan request for a given plugin slug.

## Acceptance Criteria
- AC-1 verifies FR-1: Given a valid plugin slug, when a re-scan is requested, then a scan job is recorded.

## Open Questions
1. (Q1) Which vulnerability database is authoritative for results?
2. (Q2) Who is allowed to trigger a re-scan?
3. (Q3) Should re-scans run synchronously or asynchronously?
