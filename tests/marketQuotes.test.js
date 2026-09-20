import test from "node:test";
import assert from "node:assert/strict";
import { calculateUnrealizedPnl } from "../src/utils/unrealizedPnl.js";
import { createQuoteMiddleware } from "../server/marketQuotes.js";

const position = {
  symbol: "AAPL", exchange: "NASDAQ", assetType: "stock", side: "buy",
  quantity: 10, entryPrice: 100, currency: "USD", openDate: "2026-09-10",
};
const time = Date.parse("2026-09-15T12:00:00Z");
const barTime = Date.parse("2026-09-14T04:00:00Z");
const quote = {
  symbol: "AAPL", exchange: "XNAS", price: 115, currency: "USD",
  priceType: "previous_close", asOfDate: "2026-09-14",
};
const metadata = {
  status: "OK",
  results: { ticker: "AAPL", market: "stocks", locale: "us", active: true, primary_exchange: "XNAS", currency_name: "usd" },
};
const dailyBar = {
  status: "OK", ticker: "AAPL", adjusted: false,
  results: [{ T: "AAPL", c: 115, t: barTime }],
};

async function request(handler, url = "/api/market-quote?symbol=AAPL&exchange=NASDAQ", method = "GET", headers = {}) {
  let body;
  const responseHeaders = {};
  const res = {
    setHeader(name, value) { responseHeaders[name] = value; },
    end(value) { body = JSON.parse(value); },
  };
  await handler({ url, method, headers }, res, () => { throw new Error("Unexpected fallthrough"); });
  return { status: res.statusCode, body, headers: responseHeaders };
}

function fakeProvider(details = metadata, bars = dailyBar) {
  return async (url) => ({
    ok: true, status: 200,
    json: async () => url.pathname.startsWith("/v3/reference/") ? details : bars,
  });
}

function makeHandler(fetchImpl = fakeProvider()) {
  return createQuoteMiddleware({ apiKey: "test-secret", now: () => time, fetchImpl });
}

test("long, short, fractional, loss and breakeven returns with legacy exchange names", () => {
  assert.deepEqual(calculateUnrealizedPnl(position, quote), { amount: 150, percent: 15, currency: "USD" });
  assert.equal(calculateUnrealizedPnl({ ...position, side: "sell" }, quote).amount, -150);
  assert.equal(calculateUnrealizedPnl({ ...position, side: "sell" }, { ...quote, price: 90 }).amount, 100);
  assert.equal(calculateUnrealizedPnl({ ...position, quantity: 0.5, assetType: "etf" }, quote).amount, 7.5);
  assert.equal(calculateUnrealizedPnl(position, { ...quote, price: 90 }).amount, -100);
  assert.equal(calculateUnrealizedPnl(position, { ...quote, price: 100 }).amount, 0);
  assert.equal(calculateUnrealizedPnl({ ...position, exchange: "NYSE" }, { ...quote, exchange: "XNYS" }).amount, 150);
});

test("rejects incompatible instruments, currency, market, and invalid entries", () => {
  for (const change of [{ assetType: "cfd" }, { currency: "EUR" }, { exchange: "NYSE" },
    { symbol: "OTHER" }, { quantity: 0 }, { entryPrice: 0 }, { side: "invalid" }]) {
    assert.ok(calculateUnrealizedPnl({ ...position, ...change }, quote).error);
  }
  assert.ok(calculateUnrealizedPnl(position, null).error);
  assert.ok(calculateUnrealizedPnl(position, { ...quote, price: NaN }).error);
});

test("a daily price before the entry date is not presented as the holding's performance", () => {
  assert.match(calculateUnrealizedPnl({ ...position, openDate: "2026-09-15" }, quote).error, /before you opened/);
  assert.equal(calculateUnrealizedPnl({ ...position, openDate: "2026-09-14" }, quote).amount, 150);
});

test("missing configuration, bad input, cross-site and wrong methods never call provider", async () => {
  const handler = createQuoteMiddleware({ fetchImpl() { assert.fail("Must not fetch"); } });
  assert.equal((await request(handler)).status, 503);
  for (const symbol of ["AAPL,IBM", "../AAPL", "X:BTCUSD", "Apple Inc"]) {
    const params = new URLSearchParams({ symbol, exchange: "NASDAQ" });
    assert.equal((await request(handler, "/api/market-quote?" + params)).status, 400);
  }
  assert.equal((await request(handler, "/api/market-quote?symbol=AAPL")).status, 400);
  assert.equal((await request(handler, undefined, "POST")).status, 405);
  assert.equal((await request(handler, undefined, "GET", { "sec-fetch-site": "cross-site" })).status, 403);
  let fellThrough = false;
  await handler({ url: "/another-route" }, {}, () => { fellThrough = true; });
  assert.ok(fellThrough);
});

test("uses Bearer auth, normalizes Massive results and shares cached/in-flight alias requests", async () => {
  let calls = 0;
  let currentTime = time;
  const provider = fakeProvider();
  const handler = createQuoteMiddleware({ apiKey: "test-secret", now: () => currentTime, fetchImpl: async (url, options) => {
    calls++;
    assert.equal(url.hostname, "api.massive.com");
    assert.equal(url.protocol, "https:");
    assert.ok(!url.href.includes("test-secret"));
    assert.equal(options.headers.Authorization, "Bearer test-secret");
    assert.equal(options.redirect, "error");
    assert.ok(options.signal);
    if (url.pathname.startsWith("/v2/aggs/")) {
      assert.equal(url.pathname, "/v2/aggs/ticker/AAPL/prev");
      assert.equal(url.searchParams.get("adjusted"), "false");
    } else {
      assert.equal(url.pathname, "/v3/reference/tickers/AAPL");
    }
    return provider(url);
  } });
  const responses = await Promise.all([request(handler), request(handler, "/api/market-quote?symbol=aapl&exchange=XNAS")]);
  assert.equal(calls, 2);
  assert.equal(responses[0].status, 200);
  assert.deepEqual(responses[0].body, {
    ...quote, timestamp: barTime, fetchedAt: time, source: "Massive",
  });
  assert.deepEqual(responses[0], responses[1]);
  assert.equal(responses[0].headers["Cache-Control"], "no-store");
  assert.ok(!JSON.stringify(responses).includes("test-secret"));
  await request(handler);
  assert.equal(calls, 2);
  currentTime += 15 * 60 * 1000;
  await request(handler);
  assert.equal(calls, 3, "price expires after 15 minutes; listing metadata stays cached");
  currentTime += 24 * 60 * 60 * 1000;
  await request(handler);
  assert.equal(calls, 5, "metadata is fetched again after 24 hours");
});

test("primary exchange mismatch stops before fetching any prices", async () => {
  let calls = 0;
  const handler = makeHandler(async (url) => { calls++; return fakeProvider()(url); });
  const result = await request(handler, "/api/market-quote?symbol=AAPL&exchange=NYSE");
  assert.equal(result.status, 422);
  assert.match(result.body.error, /XNAS/);
  assert.equal(calls, 1);
});

test("missing, inactive, foreign and mismatched metadata cannot become prices", async () => {
  const variants = [
    null, {}, { status: "OK", results: null },
    ...[{ ticker: "MSFT" }, { market: "crypto" }, { locale: "global" }, { active: false },
      { primary_exchange: undefined }, { currency_name: undefined }].map((change) => ({
      ...metadata, results: { ...metadata.results, ...change },
    })),
  ];
  for (const data of variants) {
    const result = await request(makeHandler(fakeProvider(data)));
    assert.equal(result.status, 502);
    assert.ok(result.body.error);
    assert.equal(result.body.price, undefined);
  }
});

test("absent, malformed, adjusted or mismatched daily bars are never interpreted as a zero price", async () => {
  const variants = [
    null, {}, { ...dailyBar, results: [] }, { ...dailyBar, ticker: "MSFT" },
    { ...dailyBar, adjusted: true },
    ...[{ c: "bad" }, { c: "115" }, { c: 0 }, { c: null }, { t: undefined },
      { t: 0 }, { t: time + 60000 }, { T: "MSFT" }].map((change) => ({
      ...dailyBar, results: [{ ...dailyBar.results[0], ...change }],
    })),
  ];
  for (const data of variants) {
    const result = await request(makeHandler(fakeProvider(metadata, data)));
    assert.equal(result.status, 502);
    assert.ok(result.body.error);
    assert.equal(result.body.price, undefined);
  }
});

test("bar timestamps stay in milliseconds and use New York dates, not the viewer's timezone", async () => {
  // A timestamp near UTC midnight still belongs to the preceding New York date.
  const timestamp = Date.parse("2026-09-14T01:00:00Z");
  const result = await request(makeHandler(fakeProvider(metadata, {
    ...dailyBar, results: [{ c: 115, t: timestamp }],
  })));
  assert.equal(result.status, 200);
  assert.equal(result.body.timestamp, timestamp);
  assert.equal(result.body.asOfDate, "2026-09-13");
});

test("upstream HTTP, API and non-JSON errors do not leak provider details or keys", async () => {
  for (const status of [401, 403, 404, 429, 500]) {
    const handler = makeHandler(async () => ({
      ok: false, status, json: async () => { throw new Error("test-secret"); },
    }));
    const result = await request(handler);
    assert.equal(result.status, status === 429 ? 429 : 502);
    assert.ok(!JSON.stringify(result).includes("test-secret"));
  }
  for (const status of ["ERROR", "NOT_AUTHORIZED"]) {
    const result = await request(makeHandler(fakeProvider({ status, message: "test-secret" })));
    assert.equal(result.status, 502);
    assert.ok(!JSON.stringify(result).includes("test-secret"));
  }
  const result = await request(makeHandler(async () => ({
    ok: true, json: async () => { throw new SyntaxError("test-secret"); },
  })));
  assert.equal(result.status, 502);
  assert.ok(!JSON.stringify(result).includes("test-secret"));
});

test("both endpoints count toward the five-call budget; cached metadata allows retry after a minute", async () => {
  let calls = 0;
  let currentTime = time;
  const handler = createQuoteMiddleware({ apiKey: "test-secret", now: () => currentTime, fetchImpl: async (url) => {
    calls++;
    const isMetadata = url.pathname.startsWith("/v3/reference/");
    const symbol = url.pathname.split("/")[4];
    return {
      ok: true,
      json: async () => isMetadata
        ? { ...metadata, results: { ...metadata.results, ticker: symbol } }
        : { ...dailyBar, ticker: symbol, results: [{ ...dailyBar.results[0], T: symbol }] },
    };
  } });
  for (const symbol of ["AAPL", "MSFT"]) {
    assert.equal((await request(handler, "/api/market-quote?symbol=" + symbol + "&exchange=XNAS")).status, 200);
  }
  const thirdUrl = "/api/market-quote?symbol=NVDA&exchange=XNAS";
  assert.equal((await request(handler, thirdUrl)).status, 429);
  assert.equal(calls, 5);
  assert.equal((await request(handler)).status, 200, "cached prices don't use the budget");
  assert.equal((await request(handler, thirdUrl)).status, 429);
  assert.equal(calls, 5);
  currentTime += 60000;
  assert.equal((await request(handler, thirdUrl)).status, 200);
  assert.equal(calls, 6, "metadata from the blocked request is reused");
});

test("failed requests count too, and concurrent requests cannot exceed the budget", async () => {
  let calls = 0;
  const handler = makeHandler(async () => {
    calls++;
    throw new Error("URL contains test-secret");
  });
  const results = await Promise.all(Array.from({ length: 10 }, (_, index) =>
    request(handler, "/api/market-quote?symbol=T" + index + "&exchange=XNAS")));
  assert.equal(calls, 5);
  assert.equal(results.filter((result) => result.status === 429).length, 5);
  assert.equal(results.filter((result) => result.status === 502).length, 5);
  assert.ok(!JSON.stringify(results).includes("test-secret"));
});
