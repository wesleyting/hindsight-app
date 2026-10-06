# Changes ready for GitHub

## Suggested title

fix: polish stock navigation, chart cues and local startup

## Description

- Keep stock shortcuts in a stable order and add accessible remove controls; preserve saved research.
- Remember the last viewed ticker separately from shortcut order.
- Add chart hover/focus feedback and a Yahoo link hint, including touch support.
- Show readable month/day chart ranges, with years across year boundaries.
- Scroll and focus expanded details and selected explanations, respecting reduced motion.
- Automatically restore the existing local development session when a stock request returns 401; retain server authentication and production behavior.

## Validation

Production build, TypeScript, presentation tests and git diff checks passed. Browser checks covered stock switching, removal/re-adding, explanation focus/scroll, keyboard chart-link feedback, and automatic local session recovery after signing out. No paid AI calls were made for these checks.

Prediction measurement was discussed and documented as a next step; no confidence scores, analyst leaderboard or background jobs were added. No database migration is needed for this pass. No commit or push performed.
