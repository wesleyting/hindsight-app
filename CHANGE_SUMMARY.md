# Changes ready for GitHub

## Suggested title

feat: replace research history with saved stock snapshots

## Description

- Add manually saved, renameable stock snapshots in the existing D1 database.
- Restore historical prices, brief, sources, prepared topics and the open explanation without AI calls.
- Compare two saved summaries and dated prices; download individual snapshots as JSON.
- Replace the cluttered answer history and research settings with a focused snapshot panel.
- Link the chart to Yahoo’s main stock page, simplify the time label, move citations after punctuation, and shorten the follow-up button to Look deeper.

## Validation

- Production build, TypeScript and presentation unit checks passed.
- Snapshot integration tests cover authentication, origin checks, stale views, missing analyses, save/list/rename/reopen, content preservation, validation and cleanup without AI calls.
- Browser verified the real TE view, snapshot saving, renaming, reopening and comparison; temporary comparison test data removed.
- Migration 0003_huge_ser_duncan.sql applied to the local D1 database.

Snapshots preserve content rather than historical styling. Source research remains internally saved for context and caching. Local snapshot data is not included in GitHub source pushes. No confidence score or analyst tracking was added. No commit or push performed.
