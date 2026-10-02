# Hindsight

A private, stock-centered weekly review prototype built with React, TypeScript, shadcn/ui, Tailwind, Vinext, and Cloudflare D1.

## Current capabilities
- Three fictional stock scenarios, two weeks of synthetic prices, normalized sector comparisons.
- Context-specific questions with authored answers, supporting sample records, and explicit uncertainty.
- Upcoming research questions and an illustrative original thesis.
- Authenticated reflections with durable D1 storage, per-user isolation, draft/reviewed status, and a journal.
- Responsive layout, keyboard-accessible component primitives, optional WebMCP stock navigation.

## Data boundaries
All companies, tickers, prices, benchmarks, disclosures, and original theses are fictional fixtures in `lib/reviews.ts`. No live market provider or AI model is connected. Do not use this fixture data to make investment decisions. The earlier sample week intentionally excludes later events.

Returns use closing price / prior Friday closing price minus one. Sector differences are percentage points. Dividends, fees, cash flows, and trading activity are excluded; this is not a portfolio accounting engine.

## Development
Requires Node 22.13+; install with `npm ci`. Start with `npm run dev` and build with `npm run build`. The portable dev server supports `/signin-with-chatgpt?return_to=/` for local simulated sign-in. Production identity comes from the Sites platform.

Generate migrations with `npm run db:generate`. After a build, apply each pending local migration using:

    node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_nifty_skrulls.sql

Do not replay an already-applied migration. Hosted migrations are managed by Sites. Reflection API validates inputs, scopes every query to authenticated user identity, and never reports success before persistence completes.

## Validation
- `node node_modules/typescript/bin/tsc --noEmit`
- `node --experimental-strip-types tests/reviews.mjs`
- Local authenticated API save/read-back; anonymous requests return 401, invalid records return 400.
- Browser verification of stock switching, question answers, and mobile/desktop layout.

## Next product slice
Capture real holdings and timestamped original theses; integrate licensed historical price data with explicit freshness and adjustment policies. Add source ingestion with event/publication/retrieval times, then evaluate AI-generated structured answers against a citation-quality test set. Keep math independent of the model and show missing evidence without guessing.
