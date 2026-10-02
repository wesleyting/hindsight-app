# Changes ready for GitHub

## Suggested commit message

```text
feat: add real-stock DeepSeek research with saved history and context

Replace the fictional dashboard with a focused stock catch-up conversation.
Fetch and validate real Yahoo Finance prices and recent headlines, generate
source-linked DeepSeek answers, and save assessments with their evidence.
Add bounded personal notes, Markdown export, cached catch-ups, and AI quotas.
```

## What changed

- Centered plain-language review; sidebar closed by default; compact follow-up questions; charts/details only when opened.
- Real ticker entry, company/exchange identity, price observations and timestamps. No fake data fallback in the active UI.
- Yahoo Finance adapter with headline relevance/time filtering, deduplication, safe source URLs and explicit stale/failure states.
- Server-side DeepSeek integration with a versioned grounding prompt, source citations, finite context/output limits, timeout and clear errors.
- Durable account-scoped catch-ups and follow-up answers, preserving the exact source snapshot used at the time.
- Previous-analysis comparison, user-selected notes/excerpts, and Markdown export.
- Fifteen-minute market cache, six-hour identical catch-up reuse, stored token usage, daily request quota and in-flight request lock.
- D1 schema/migration, local configuration template, tests, and updated setup/handoff documentation.

## Validation

- TypeScript check and production build passed during implementation.
- Market parser/provider tests cover identity, numerical returns, malformed prices, relevance, dates, URLs, deduplication and failure behavior.
- Mocked DeepSeek checks cover input contract, token usage, missing/invalid citations, truncation and upstream errors.
- Live local AAPL prices/headlines and a DeepSeek-generated catch-up verified.
- Saved catch-up reopened; unchanged request returned the same saved result with no new AI call.
- Local integration checks passed for auth, origins, ticker validation, note persistence/limits/cleanup and Markdown export.

## Files and data to keep out of Git

`.dev.vars` contains the real key and is ignored. `.dev.vars.example` contains blank placeholders only. `.wrangler/state`, `.sites-runtime`, build output and exports are local/private artifacts. Pushing this repository does not upload your saved local research; back that up separately.

## Remaining limitations

Yahoo access is unofficial and headline-only, with no guarantee of full coverage or availability. Quotes can be delayed/intraday; returns are not total returns. DeepSeek can still misinterpret sources; citations do not guarantee factual correctness. No Reddit/filings/full-article search or hosted deployment. Account-scoped request caps limit attempts rather than exact currency spend. Export includes up to 30 recent analyses per stock. The local sign-in is simulated and must not be used as public authentication.

No commit or push has been performed. Review the diff in GitHub Desktop or your Git client, then use the suggested message above.
