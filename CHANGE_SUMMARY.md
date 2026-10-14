# Changes ready for GitHub

## Suggested title

feat: compare snapshot price outcomes and clarify brief freshness

## Description

- Show earlier-to-later price movement and percentage change between saved snapshots.
- Order comparison summaries by recorded market time, regardless of selection order.
- Avoid calculations for incompatible or insufficient observations.
- Clarify that price movement is not an AI accuracy score or dividend-inclusive return.
- Keep the pending freshness improvement: show research dates near brief headings and flag updated chart prices.
- Reuse stored data without extra AI calls and add regression coverage.

## Validation

Production build, TypeScript, snapshot comparison tests and presentation regression tests passed. No migration, commit or push performed.
