# Changes ready for GitHub

## Suggested title

fix: refresh briefs in place and improve snapshot controls

## Description

- Make explicit brief refresh bypass the analysis cache and show progress, success or errors in place without auto-scrolling.
- Preserve expanded details while refreshing and adopt the analysis's current market context.
- Add snapshot deletion with inline confirmation and clean up open/deleted comparison views.
- Default snapshot names to their covered price dates and show stored date ranges in the list.
- Highlight the full selected stock chip and remove the redundant chart-link tooltip.

## Validation

Production build, TypeScript and snapshot integration checks passed, including covered date ranges and deletion. A live TE refresh generated a new brief and timestamp; the browser stayed in place during research. Browser checks verified the snapshot naming placeholder, range labels, and delete confirmation without deleting user snapshots. No database migration, commit or push performed.
