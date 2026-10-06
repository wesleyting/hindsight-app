# Hindsight handoff

## October 5 — interaction polish

Stock shortcuts keep insertion order, have labelled remove controls, and remember the last opened stock independently. Removing a shortcut preserves its database research and snapshots. Chart links have hover/focus cues and touch-visible link hints; chart dates use readable month/day ranges (years included across year boundaries). Read more and prepared explanations scroll into view and receive keyboard focus, respecting reduced-motion preferences.

In development on loopback hosts only, a 401 while opening a stock invokes the existing local sign-in endpoint once and retries. This restores the same existing local identity and data; server authentication checks remain intact and production does not auto-sign-in. It does not call AI. If no shortcuts are saved, the user still chooses a ticker.

Forecast evaluation remains a proposed next feature: immutable timestamped predictions with named forecaster/model version, horizon, direction/target, evidence and optional probability; deterministic outcomes using consistently adjusted prices and matched horizons. Do not treat general analyst Buy ratings as one-week predictions or invent probabilities from prose. Report sample counts and benchmark results; all recorded forecasts must remain visible, including failures. No scoring or automatic weekly research is implemented in this pass.


## October 5 — saved stock views

Snapshots replace the visible research-history list. Saving is manual: Snapshots > Save snapshot preserves the displayed chart data, brief, source text, prepared topics, open explanation and expanded state in the existing account-scoped D1 database. Snapshot names are editable. Opening a snapshot restores a clearly labelled historical view with research controls disabled; Back to latest restores the current view. Two saved snapshots can compare their takeaways and dated prices side by side. This is preserved content rendered in the current UI, not a pixel screenshot. Saving, renaming, opening and comparing make no AI calls. Research still persists internally for cache and context, but each answer no longer becomes a visible history item.

Snapshot JSON downloads are available from Snapshots while viewing a saved snapshot. Downloads do not yet have an import UI. Local D1 storage under `.wrangler/state` remains private and ignored by Git; GitHub pushes do not back up snapshots. Supabase is not required. Apply the new `drizzle/0003_huge_ser_duncan.sql` migration once to databases lacking `stock_snapshots` (already applied locally). Use the same local Wrangler command shown below with this file, after checking existing tables.

The price chart links to the main Yahoo stock page and uses a simple duration label (1 week for 6–9 calendar days; actual day count otherwise). Citations appear after punctuation and the follow-up button says Look deeper. Research settings have been removed from the snapshot panel; setup instructions remain only for an unconfigured app. No AI stock-confidence percentage or analyst leaderboard is implemented: dated predictions, horizons, attribution and outcome rules must be defined first.

These notes supersede older History/settings UI descriptions below.


## Latest presentation update

The app is a centered stock brief without a sidebar. History is a header button; export and research settings live inside History. Refresh brief is a real button. The takeaway’s Read more control expands directly below it. Citations render as compact superscripts, and the larger daily-price chart links to Yahoo Finance. Routine saved/opened status messages were removed.

The optional brief.upside explains a supported positive scenario, not an assertion about buyers’ motives. Downside and positive-case cards appear only when sourced. brief.watch holds at most two future dates with reported/estimated labels; the full date must appear in cited extracted text. No date is invented to fill the layout. The model can still misinterpret source text. Legacy briefs render without these optional additions until refreshed. No migration is required.

## Current behavior — October 4

- Catch-ups provide a complete, plain-language takeaway and an optional future-risk sentence, stored in `research.brief`. No line-clamping or ellipses. “More detail” expands the full answer in the same section. Legacy answers remain readable in full until updated.
- Prepared topics use short labels such as “Funding risk” or “Biggest weaknesses”, with an explanation backed by retrieved article text. Missing/unsupported topics are omitted. No filler Reddit or self-evaluation suggestions. “Look deeper · new research” starts a targeted search and replaces the selected answer.
- Reddit and social-media retrieval are disabled. Tavily excludes those domains and returned results are filtered again. Result titles must identify the company/ticker, reducing unrelated-company matches. This is a relevance check, not factual verification.
- Research version 2 prevents earlier Reddit-containing evidence or assessments from being reused as current context. Old records remain in history. No database migration is required; the existing research JSON stores the new brief.
- Risk wording distinguishes possible future dilution from actual share issuance and never assumes either caused a price move. Citations alone do not establish causation or correctness.

Earlier dated sections below describe the implementation history; these points supersede their Reddit and summary-display behavior.

Updated October 2, 2026. Workspace: `C:/Users/wesle/Desktop/Github/hindsight-app`.

## Product

Hindsight is a quick “what did I miss?” stock catch-up for an ordinary owner, not an advanced trading dashboard or required decision journal. A centered conversation, closed sidebar, brief plain-language summary, relevant follow-up questions and optional analytics. AI should revisit what it previously said, including uncertainties and corrections. Separate facts, reports, possible explanations and unknowns. Do not infer causation from price timing alone.

## Current work

The user chose DeepSeek and requested real data, saved context, token savings and a GitHub change summary. They clarified this is **local and ready for GitHub**, not a hosted deployment. They entered their API key in `.dev.vars.example`; it was safely moved into ignored `.dev.vars`, and the template was cleared. Never print or commit the key.

The active UI now uses real ticker input, Yahoo Finance recent daily prices and headlines, and DeepSeek catch-ups/follow-ups. No fictional stocks are displayed. The live connection succeeded for AAPL. Yahoo sources remain headlines only; Tavily now adds article text/search excerpts and public Reddit thread samples. The user provided a Tavily key, saved only in ignored .dev.vars. Never echo either key. Yahoo's unofficial endpoints initially rejected the worker's default request; an honest Hindsight User-Agent resolved the live check. Failure/staleness remains explicit.

## Storage and API behavior

- D1 tables: market_cache, analyses, saved_notes, ai_usage, ai_locks; existing reflections retained.
- Migrations `0001_cheerful_robbie_robertson.sql` and `0002_many_brood.sql` are applied locally. 0002 adds nullable analyses.research; old answers remain compatible. Never replay blindly.
- Answers persist with sources/model/token usage/date. Previous catch-up and two recent follow-ups form bounded context.
- Up to eight notes of 600 characters each per user/stock. Editable answer excerpt saving and Markdown export.
- Market cache 15 minutes; identical catch-up cache six hours; no background AI calls.
- Atomic 30 AI attempts/account/UTC day and one in-flight cycle/account (eight-minute lease). Up to three model calls/cycle, each 90 seconds and 2,400 output tokens. Quota counts every model-call reservation, including format repairs. Two initial Tavily searches plus up to two extra searches and one comparison.
- The model instructions live in `lib/deepseek.ts`; no runtime Markdown prompt file is needed.
- Local state is in ignored `.wrangler/state`; it is not backed up by pushing GitHub source.

## Important files

- app/review-app.tsx: real research UI and user flows.
- app/api/research/route.ts: real market data and account-scoped history.
- app/api/chat/route.ts: DeepSeek, cache, quota, persistence.
- app/api/notes/route.ts and app/api/research/export/route.ts: selected memory and export.
- lib/market.ts: Yahoo adapter and validation.
- lib/deepseek.ts: bounded tool cycle, short JSON briefs/prepared questions, provider validation and correction.
- lib/investigation.ts: Tavily source gathering, deduplication, coverage and deterministic matched-date adjusted-price comparison.
- lib/research-store.ts: D1 data access.
- README.md: setup, privacy, costs, data limits and verification commands.
- CHANGE_SUMMARY.md: GitHub-ready summary and commit suggestion.

## Verification and remaining limits

Real AAPL prices/headlines and one generated catch-up were verified. Reopening and cache reuse worked without another AI call. Note persistence, export, unauthenticated rejection, origin checks and provider mocks passed. Final test results are recorded in CHANGE_SUMMARY.md.

Tavily search/extracted text and sampled public Reddit are connected; no exhaustive Reddit coverage, filing collection, brokerage integration, scheduled monitoring or hosted deployment. Headline coverage can be incomplete and incidental. A proper licensed source is a later improvement. The original fixture module and reflection API are legacy and not used by the active real-data experience.

## Running

Node is at `C:/Program Files/nodejs/node.exe`. `node scripts/run-framework.mjs dev` serves port 5173. Local simulated sign-in: `/signin-with-chatgpt?return_to=/`. Restart after secret changes. Server was started hidden with output in ignored `.sites-runtime/research-dev*.log`; check the current port/process before starting another. Use `.dev.vars`, not `.dev.vars.example`, for the secret.

## Hosting

Existing private Sites project ID: `appgprj_6abdca11feb48191bde67ee50faa9296`. Never register a duplicate. No deployment or verified hosted URL exists. User currently wants to push to GitHub themselves.

## Product changes in this pass

User disliked headline lists and asked for an investigator that saves them research time. The UI now keeps stock-specific prepared answers collapsed, exposes retrieved evidence on demand, offers alternative-stock/date comparisons and dated optional thoughts. Previous AI opinions are not treated as facts. Later returns are not treated as proof of earlier decision quality. Follow-up source reuse lasts an hour; repeated identical catch-ups still reuse a six-hour cache. No paid calls simply from opening the app.

Tavily search queries are model-generated public-company topics; instructions prohibit private notes/amounts in queries. Up to 12 sources of 3,500 characters each are stored alongside the answer. Individual source snippets can be inspected in the UI. DeepSeek may misread sources, and citations alone do not verify a claim.

## October 3 simplification

The current UI replaces the growing chat with a single selected-answer panel. Prepared questions say “View answer” and open saved content without an API call; a new question explicitly starts research. History and sources open separately. The input stays sticky, price movement is shown as numbers and a sparkline, and stock shortcuts sit below an empty search field. Excerpt saving, the notes quota counter and the dedicated comparison form were removed. Existing notes are preserved and manageable in history; comparison is still available through a question.

Catch-up instructions now aim for 60–100 words without narrating the price chart. Word count and headline-count style rules no longer discard otherwise usable answers. Optional malformed suggestions are omitted rather than failing the whole catch-up. Unknown citations in the main answer still fail validation. Research permits two tool rounds and up to four model calls total, allowing a final formatting repair after research; 3,200 output tokens per call. The daily 30-call limit still applies. This supersedes earlier UI and three-call limit descriptions above.
