# Changes ready for GitHub

## Suggested title

feat: redesign the centered stock brief with balanced outlooks

## Description

- Remove the sidebar and organize the app around a centered research workspace.
- Promote History and Refresh brief to visible buttons; move export into History.
- Put Read more directly beneath the takeaway and use compact superscript citations.
- Add sourced positive/downside cases and optional upcoming dates with estimate labels.
- Validate that displayed dates occur in cited article text and are not in the past.
- Improve the daily-price chart and link it to Yahoo Finance.
- Remove routine saved-answer status text and polish controls, spacing and card styling.

No commit or push performed. Keys and local research remain excluded from Git.

## Validation

- TypeScript check and production build passed.
- DeepSeek regression tests, upcoming-date validation tests, and local API integration tests passed.
- A live TE refresh returned a sourced takeaway, upside and downside; the repeat request reused the cached result.
- Checked the centered layout, inline expansion, History and export controls in the browser.
