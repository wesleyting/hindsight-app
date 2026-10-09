# Changes ready for GitHub

## Suggested title

feat: refine stock briefs with interactive charts and clearer updates

## Description

- Refine typography, spacing and card styling for an easier-to-scan stock view.
- Add source-backed brief headlines and a dated “Since your last brief” comparison when supported.
- Distinguish new developments from rewritten summaries or newly retrieved coverage of older events.
- Reject explicit date contradictions in comparison notes during parsing, display and export.
- Add daily-price exploration with pointer, touch and keyboard support; keep Yahoo Finance as a separate link.
- Show saved prices and research previews in snapshot cards without extra AI calls.
- Include headlines and comparison notes in Markdown exports.

## Validation

Production build, TypeScript, DeepSeek regression tests and snapshot integration tests passed. Comparison tests cover first briefs with no prior context, valid dated comparisons and explicit date contradictions. Snapshot tests verify recorded preview, price and currency. Browser checks include a completed live DeepSeek refresh, keyboard chart navigation and saved snapshot previews.

Existing saved briefs remain compatible; refresh to obtain headlines and comparison notes. No migration, commit or push performed.
