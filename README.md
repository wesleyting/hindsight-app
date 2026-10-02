# Hindsight

A personal stock catch-up app: open a ticker, see real prices and recent headlines, ask DeepSeek what matters, and revisit earlier assessments. React, TypeScript, shadcn/ui, Vinext and Cloudflare D1.

## Run locally

Requires Node 22.13 or newer. Install dependencies with `npm ci`, then:

1. Copy `.dev.vars.example` to `.dev.vars` **only if `.dev.vars` does not already exist**.
2. Set `DEEPSEEK_API_KEY` in `.dev.vars`. Default `DEEPSEEK_MODEL` is `deepseek-flash`.
3. Build with `npm run build` and apply any missing local database migrations below.
4. Start `npm run dev` and open `http://127.0.0.1:5173/`.
5. Use `/signin-with-chatgpt?return_to=/` for local simulated sign-in.
6. Enter a ticker such as AAPL or SHOP.TO. Confirm the company/exchange shown, then select **Catch me up**.

Restart the dev server after changing secrets. The app's “DeepSeek configured” label means a key exists, not that it has been validated; a successful answer validates the connection. Never put real keys in `.dev.vars.example`, browser code, screenshots or Git. `.dev.vars`, `.env*`, build output and local database state are ignored.

On Windows, if npm is not on PATH, use `& 'C:/Program Files/nodejs/node.exe' scripts/run-framework.mjs dev` (or `build`).

## Database setup

Saved analyses, source snapshots and notes live in `.wrangler/state` for local use. This directory is deliberately not pushed to GitHub: source control is not a backup of private research. Keep a separate backup of local state or export individual stocks to Markdown. Export includes up to 30 recent analyses and all eight saved notes for the selected stock.

After a build, inspect existing tables before applying SQL. Do not replay applied migrations:

```powershell
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --command "SELECT name FROM sqlite_master WHERE type='table'"
```

For a fresh database apply `drizzle/0000_nifty_skrulls.sql`, then `drizzle/0001_cheerful_robbie_robertson.sql`. For the original prototype database, apply only `0001` if its research tables are absent:

```powershell
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_cheerful_robbie_robertson.sql
```

The research migration has already been applied to this checkout's local state. It adds `market_cache`, `analyses`, `saved_notes`, `ai_usage` and `ai_locks`; original `reflections` are preserved. Drizzle schema and migration metadata are included for fresh checkouts.

## Real data and its limits

- Yahoo Finance supplies recent daily observations and ticker-associated news headlines. No Yahoo key is required by the current unofficial endpoints. They can change, rate-limit or fail. This integration is for personal local evaluation; availability and redistribution rights must be reassessed before distribution/hosting.
- News coverage is **headlines only**, with publisher, publication time, URL and retrieval time. The app does not claim to have read full articles. Headlines published after the price observation cannot establish the cause of the earlier move. Reddit, filings and a dedicated news/search service are not connected.
- Price change is computed in code from the last six valid daily observations (up to five trading intervals). It is not a calendar-week or total-return calculation. Latest observations may be intraday, prices may be delayed, and dividends/fees are excluded. Corporate actions can affect comparisons.
- Invalid symbols, mismatched identities, missing prices and provider failures are explicit errors. No fake data is substituted. If refreshing fails and a saved market snapshot exists, it is shown with its original retrieval date and a visible stale-data warning.
- Legacy fictional fixtures remain only for existing numerical tests and the old reflection API. The active research UI, market API and DeepSeek prompt do not use them.

## DeepSeek instructions and memory

No Markdown instruction file is required at runtime. `lib/deepseek.ts` contains the versioned system prompt. `app/api/chat/route.ts` builds context on the server from validated market records and account-scoped database queries. The browser cannot provide a system prompt or replace the server's source data.

Each request includes:

- Current price observations and at most eight relevant recent headlines.
- The latest saved catch-up (up to 2,500 characters), labeled as a fallible earlier assessment, not new evidence.
- Up to eight user-selected notes of 600 characters each, labeled as user context.
- For a follow-up, up to two recent saved question/answer pairs, with answers capped at 2,000 characters.

The AI is instructed to be brief, use everyday language, cite [P]/[N1] source IDs, distinguish uncertainty from facts, avoid fabricated sources and avoid claiming that timing proves causation. Unknown source IDs and incomplete responses are rejected. Citations link to the supplied records; their presence alone does not prove a claim is supported. Read important sources yourself.

Every successful AI answer is saved with its question, model, token usage, timestamps and source snapshot. Refreshing prices never rewrites an old assessment. **Save an excerpt** opens an editable note; selecting text first pre-fills that selection. Notes are included in future AI calls, so save only context you want sent to DeepSeek. **Export Markdown** downloads a human-readable copy; the app does not resend the entire export to the model.

## Speed and API costs

- Prices/headlines: 15-minute database cache; explicit refresh available.
- Catch-ups: unchanged market context, notes, model and prompt version reuse an existing answer for six hours. Opening saved research itself makes no AI call.
- Bounded context instead of resending all history or an entire Markdown file.
- Stable system prompt supports provider-side prefix caching; actual hit-token usage is stored when reported. Savings are not guaranteed.
- 1,200 output-token limit; 45-second provider timeout; no automatic paid retries or background polling.
- Atomic D1 quota: 30 new AI attempts per user per UTC day (including failures), plus one in-flight AI call per user. These are request limits, not a currency-denominated budget.

## Validation

```powershell
node node_modules/typescript/bin/tsc --noEmit --incremental false
node --experimental-strip-types tests/reviews.mjs
node --experimental-strip-types tests/market.mjs
node --experimental-strip-types tests/deepseek.mjs
npm run build
```

`node tests/local-research.mjs` additionally exercises the running local server after a real AAPL catch-up exists. It verifies authentication, origins, provider cache, persistence, Markdown export and note limits. It creates and removes its own temporary note. It does not call DeepSeek.

## GitHub and deployment

See `CHANGE_SUMMARY.md` for a suggested commit message, changed behavior, validation and remaining limits. This request prepares the local app for GitHub; no commit, push or hosted deployment is performed. The saved Sites identity is retained. Local simulated sign-in is not public production authentication; hosted secrets and migrations must be configured separately before any future deployment.
