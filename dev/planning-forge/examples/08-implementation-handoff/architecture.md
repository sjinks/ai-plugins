## Design Contract Status
`ready` - Sufficient FR/AC/interface context to make builder-ready decisions.

## Architecture Decisions
- D-1 Storage: persist reports in the existing relational store. Rationale: reuse
  current schema and migrations. Tradeoff: none material. Trace: FR-1, AC-1.
- D-2 Ingestion: pull from the configured source on a scheduled job. Rationale: source
  is poll-only. Tradeoff: latency bounded by poll interval. Trace: FR-1, AC-1.
- D-3 Validation: reject malformed payloads at the ingestion boundary. Trace: EDGE-1.

## Verification Seams
- The ingestion boundary and the severity-assignment service are the primary seams.
