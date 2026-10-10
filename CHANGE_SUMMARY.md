# Changes ready for GitHub

## Suggested title

feat: make chart price changes easier to read

## Description

- Show the absolute currency change alongside the period percentage.
- Show percentage change since the first displayed price when exploring chart dates.
- Keep hover, touch and keyboard readouts compact and responsive.
- Reuse loaded market data without extra API or AI calls.

## Validation

TypeScript and diff checks passed. Browser verification with real loaded prices confirmed 0.00% at the first observation and -5.61% at the next observation using keyboard navigation. No migration is required. No commit or push performed.
