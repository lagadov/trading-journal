import { normalizeExchange } from "../src/utils/marketExchange.js";

const CACHE_MS = 15 * 60 * 1000;
const METADATA_CACHE_MS = 24 * 60 * 60 * 1000;
const REQUESTS_PER_MINUTE = 5;
const marketDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
});

function tradingDate(timestamp) {
  const parts = Object.fromEntries(marketDate.formatToParts(timestamp).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function remember(cache, key, value) {
  if (cache.size >= 200) cache.delete(cache.keys().next().value);
  cache.set(key, value);
}

function reply(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

export function createQuoteMiddleware({ apiKey, fetchImpl = fetch, now = Date.now }) {
  const cache = new Map();
  const metadataCache = new Map();
  const pending = new Map();
  let requests = [];

  async function fetchMassive(path) {
    // Both metadata and prices count toward Basic's five upstream calls per minute.
    requests = requests.filter((time) => now() - time < 60000);
    if (requests.length >= REQUESTS_PER_MINUTE) {
      return { error: "Massive Basic request limit reached. Try Refresh in a minute.", status: 429 };
    }
    requests.push(now());
    try {
      const response = await fetchImpl(new URL(path, "https://api.massive.com"), {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
        signal: AbortSignal.timeout(12000),
        redirect: "error",
      });
      if (!response.ok) {
        return {
          status: response.status === 429 ? 429 : 502,
          error: response.status === 429 ? "Massive's allowance was reached. Try Refresh in a minute."
            : [401, 403].includes(response.status) ? "Check MASSIVE_API_KEY and your Massive Stocks plan access."
              : "Price unavailable from Massive. Check the US stock ticker and your plan's coverage.",
        };
      }
      const data = await response.json();
      if (!data || (data.status && data.status !== "OK")) {
        return { status: 502, error: "Massive could not provide this data. Check the ticker, API key and Stocks plan access." };
      }
      return { data };
    } catch {
      // Never forward provider errors, headers or URLs: they could contain credentials.
      return { status: 502, error: "Could not reach Massive or read its response. Please try again." };
    }
  }

  async function tickerDetails(symbol) {
    const cached = metadataCache.get(symbol);
    if (cached && now() - cached.fetchedAt < METADATA_CACHE_MS) return cached;
    const response = await fetchMassive(`/v3/reference/tickers/${encodeURIComponent(symbol)}`);
    if (response.error) return response;
    const details = response.data.results;
    if (!details || details.ticker !== symbol || details.market !== "stocks" || details.locale !== "us" ||
      details.active === false || typeof details.primary_exchange !== "string" ||
      !/^[A-Z0-9]{4}$/.test(details.primary_exchange) || typeof details.currency_name !== "string" ||
      !/^[A-Za-z]{3}$/.test(details.currency_name)) {
      return { status: 502, error: "Massive did not return complete listing details for an active US stock or ETF." };
    }
    const result = {
      symbol, exchange: details.primary_exchange, currency: details.currency_name.toUpperCase(), fetchedAt: now(),
    };
    remember(metadataCache, symbol, result);
    return result;
  }

  async function quote(symbol, exchange) {
    const key = JSON.stringify([symbol, exchange]);
    const cached = cache.get(key);
    if (cached && now() - cached.fetchedAt < CACHE_MS) return cached;
    if (pending.has(key)) return pending.get(key);
    const promise = (async () => {
      const details = await tickerDetails(symbol);
      if (details.error) return details;
      if (details.exchange !== exchange) {
        return { status: 422, error: `This ticker's primary listing is ${details.exchange}. Check this holding's exchange.` };
      }
      // Basic has daily bars, not snapshots/live quotes. Keep prices unadjusted:
      // the journal does not automatically split-adjust the user's entry/quantity.
      const response = await fetchMassive(`/v2/aggs/ticker/${encodeURIComponent(symbol)}/prev?adjusted=false`);
      if (response.error) return response;
      const data = response.data;
      const bar = Array.isArray(data.results) && data.results.length === 1 ? data.results[0] : null;
      if (!bar || data.ticker !== symbol || (bar.T !== undefined && bar.T !== symbol) || data.adjusted !== false ||
        !Number.isFinite(bar.c) || bar.c <= 0 || !Number.isSafeInteger(bar.t) || bar.t <= 0 ||
        bar.t > now() || Number.isNaN(new Date(bar.t).getTime())) {
        return { status: 502, error: "Massive returned no usable previous trading-day close for this ticker." };
      }
      const result = {
        symbol, exchange: details.exchange, currency: details.currency,
        price: bar.c, timestamp: bar.t, asOfDate: tradingDate(bar.t),
        priceType: "previous_close", fetchedAt: now(), source: "Massive",
      };
      remember(cache, key, result);
      return result;
    })();
    pending.set(key, promise);
    try { return await promise; } finally { pending.delete(key); }
  }

  return async (req, res, next) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname !== "/api/market-quote") return next();
    if (req.method !== "GET") return reply(res, 405, { error: "Only GET is supported." });
    if (req.headers["sec-fetch-site"] === "cross-site") {
      return reply(res, 403, { error: "Cross-site price requests are not allowed." });
    }
    const symbol = (url.searchParams.get("symbol") ?? "").trim().toUpperCase();
    const exchange = normalizeExchange(url.searchParams.get("exchange"));
    if (!/^[A-Z0-9][A-Z0-9.-]{0,39}$/.test(symbol) || !/^[A-Z0-9]{4}$/.test(exchange)) {
      return reply(res, 400, { error: "Enter a US market ticker and primary exchange, such as AAPL and NASDAQ (XNAS)." });
    }
    if (!apiKey?.trim()) {
      return reply(res, 503, { error: "Massive is not connected yet. Set MASSIVE_API_KEY in .env.local and restart the app server." });
    }
    const result = await quote(symbol, exchange);
    reply(res, result.error ? result.status : 200, result);
  };
}
