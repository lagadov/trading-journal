# Market prices and unrealized P&L

The app uses **Massive Stocks Basic** to estimate open-position P&L from the previous trading-day close. It does not fetch live prices or intraday snapshots.

## Setup

1. Open `.env.local` in `pl-calendar`. If it does not exist, copy `.env.example`.
2. Replace the old provider variable with `MASSIVE_API_KEY=your_new_massive_key`. Use a key from your Massive account, not the former provider's key.
3. Stop and restart `npm run dev` (or restart `npm run preview` after building).
4. Edit a holding to use its exact US stock/ETF ticker and primary listing exchange. For example: `AAPL`, `NASDAQ` (or `XNAS`), and an entry price in `USD`.
5. Open Positions and check the closing-price date. Refresh retries an unavailable price, but does not bypass the server cache.

Keep the key server-side: **do not add a `VITE_` prefix**. `.env.local` is ignored by Git; `.env.example` must contain only placeholders. The server sends the key to Massive in an Authorization header, never to the browser. Rotate any credential previously pasted into chat, logs, or a shared example file.

## Provider adapter

- `vite.config.js` reads `MASSIVE_API_KEY` and mounts `/api/market-quote`.
- `server/marketQuotes.js` calls `GET https://api.massive.com/v3/reference/tickers/{ticker}` to verify the listing exchange and currency. Metadata is cached for 24 hours.
- It then calls `GET https://api.massive.com/v2/aggs/ticker/{ticker}/prev?adjusted=false` and reads `results[0].c`.
- Massive's `results[0].t` is already in milliseconds and marks the **start of the bar window**, not the time of a trade. The adapter derives the bar's calendar date in America/New_York and returns `asOfDate`, `priceType: "previous_close"`, and `source: "Massive"`.
- `UnrealizedPnl.jsx` displays that date and explicitly labels the result as an end-of-day estimate.

Primary listing exchanges use ISO MICs. Existing `NASDAQ` and `NYSE` entries map to `XNAS` and `XNYS`; other listings need the exact four-character code returned by Massive. A different listing, missing currency, delisted security, or unsupported market produces an error instead of an invented price. This adapter covers US-listed stocks/ETFs, not CFDs, foreign listings, forex or crypto.

## Basic limits and refresh behavior

Massive Basic allows **five API calls per minute**. Both the metadata request and price request count. A newly encountered ticker normally costs two calls; later price refreshes cost one while metadata remains cached.

The server enforces that limit for its own process, shares in-flight requests for identical tickers/exchanges, and caches prices for 15 minutes. Multiple holdings can exhaust the allowance on first load. Affected cards show an error: wait a minute and click Refresh. Other applications using the same key can also consume the provider allowance.

Cards check every 15 minutes while the page is visible. This does **not** make Basic prices update intraday. Previous trading-day prices can be several calendar days old over weekends/holidays; the actual date is always shown. A price over a week old is flagged. Server restarts clear the in-memory cache and local rate counter.

## Calculation and limitations

- Buy: `(closing price - entry price) * quantity`.
- Sell: `(entry price - closing price) * quantity`.
- Percentage return uses entry value, not margin or leverage.
- A holding opened after the available close date remains unvalued until a daily price on or after its entry date is available.
- Currency, ticker and exchange must match the holding. No FX conversion is performed.
- Estimates exclude fees, funding, taxes and dividends. Prices are requested unadjusted; stock splits are **not** automatically reflected in stored entry prices or quantities. Update those details if a holding undergoes a split.
- CFDs and other instruments require broker-specific contract sizing and pricing.
- Existing holdings remain in browser storage. Fetching prices does not rewrite their entry records.
- Missing data, provider/network failures and rate limits produce an unavailable message, never a zero P&L.

## Deployment

The Vite plugin installs the endpoint for **local development and preview only**. Uploading `dist` alone does not deploy this backend. A hosted app needs a backend/serverless route using the handler, a server secret, authentication and shared usage limits. Vite preview is not a production server. Also check Massive's display/redistribution licensing before showing its prices to other users; Basic is an individual-use plan.

## Verification

Run `node --test tests/marketQuotes.test.js` and `npm run build`.

The tests use mock Massive responses and do not spend API credits or verify a real key's access. After entering your own key, verify a holding's ticker, listing exchange, currency, closing price and price date against Massive.

## Official references

- [Massive authentication](https://massive.com/docs/rest/quickstart)
- [Ticker overview](https://massive.com/docs/rest/stocks/tickers/ticker-overview)
- [Previous day bar: endpoint, fields and plan access](https://massive.com/docs/rest/stocks/aggregates/previous-day-bar)
- [Stocks plans, rate limits and licensing](https://massive.com/stocks)
