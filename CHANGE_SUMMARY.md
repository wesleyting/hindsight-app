# Changes ready for GitHub

## Suggested title

fix: show both outlooks and refresh research throughout the week

## Description

- Keep upside and downside cards visible, clearly identifying missing evidence without asserting no upside or risk exists.
- Add targeted investigation buttons for missing outlooks.
- Search positive prospects as well as financial risks and require evidence-backed assessment of both sides.
- Fetch fresh market data on explicit refresh, display a completion timestamp, and handle expired local sessions and offline-server errors.
- Clarify that research uses a rolling window and can be regenerated any day.

## Validation

- TypeScript, DeepSeek regression and investigation tests passed.
- Tests preserve supported downside while rejecting absent, headline-only or unknown-citation upside; initial retrieval retains its two-search budget.
- A real TE refresh on Tuesday, October 6 completed with updated market data, new source material and a new dated brief containing both outlooks.

The local server was restarted and is running on port 5173. A missing outlook is a research gap, not proof of absence; no exhaustive-research or factual-verification guarantee is made. No migration, commit or push performed.
