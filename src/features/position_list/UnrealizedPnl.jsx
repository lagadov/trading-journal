import { useEffect, useState } from "react";
import { calculateUnrealizedPnl } from "../../utils/unrealizedPnl.js";
import { normalizeExchange } from "../../utils/marketExchange.js";

const REFRESH_MS = 15 * 60 * 1000;

function formatNumber(value) {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 4 }).format(value);
}

function UnrealizedPnl({ position }) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const symbol = position.symbol.trim().toUpperCase();
  const exchange = normalizeExchange(position.exchange);
  const supported = ["stock", "etf"].includes(position.assetType);
  const eligible = supported && /^[A-Z0-9][A-Z0-9.-]{0,39}$/.test(symbol) && /^[A-Z0-9]{4}$/.test(exchange);
  const requestKey = JSON.stringify([symbol, exchange, attempt]);

  useEffect(() => {
    if (!eligible) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ symbol, exchange });
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 30000);
    async function load() {
      try {
        const response = await fetch(`/api/market-quote?${params}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok || data.error) throw new Error(data.error || "Price unavailable. Please try again.");
        if (!Number.isFinite(data.price) || data.price <= 0 || !Number.isFinite(data.timestamp) ||
          data.priceType !== "previous_close" || typeof data.asOfDate !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(data.asOfDate) || data.source !== "Massive" ||
          typeof data.symbol !== "string" || typeof data.currency !== "string" || typeof data.exchange !== "string") {
          throw new Error("The price service returned an incomplete quote.");
        }
        if (active) setResult({ key: requestKey, quote: data, receivedAt: Date.now() });
      } catch (error) {
        if (active) setResult({ key: requestKey, error: error.name === "AbortError"
          ? "The price request timed out. Please try again."
          : error instanceof SyntaxError ? "Price service unavailable. Check that the app's server is running."
            : error.message });
      } finally { clearTimeout(timeout); }
    }
    load();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") setAttempt((value) => value + 1);
    }, REFRESH_MS);
    return () => { active = false; clearTimeout(timeout); clearInterval(interval); controller.abort(); };
  }, [eligible, symbol, exchange, requestKey]);

  if (!supported) return <div className="holding-valuation"><p>Unrealized P&amp;L unavailable</p>
    <small>CFDs and other instruments need broker-specific contract and price data.</small></div>;
  if (!eligible) return <div className="holding-valuation"><p>Add price details</p>
    <small>Edit this holding to enter a US ticker and primary exchange, for example AAPL / NASDAQ (XNAS).</small></div>;

  const loading = result?.key !== requestKey;
  const quote = !loading ? result?.quote : null;
  const pnl = quote ? calculateUnrealizedPnl(position, quote) : null;
  const error = !loading && (result?.error || pnl?.error);
  const oldQuote = quote && result.receivedAt - quote.timestamp > 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="holding-valuation" aria-live="polite">
      <div className="holding-valuation-heading">
        <span>Unrealized P&amp;L</span>
        <button type="button" disabled={loading} aria-label={`Refresh ${position.symbol} price`}
          onClick={() => setAttempt((value) => value + 1)}>Refresh</button>
      </div>
      {loading ? <p>Getting market price…</p> : error ? <p className="holding-quote-error">{error}</p> : (
        <>
          <p className={`holding-pnl ${pnl.amount > 0 ? "holding-pnl-profit" : pnl.amount < 0 ? "holding-pnl-loss" : ""}`}>
            {pnl.amount > 0 ? "+" : ""}{formatNumber(pnl.amount)} {pnl.currency}
            <span> ({pnl.percent > 0 ? "+" : ""}{pnl.percent.toFixed(2)}%)</span>
          </p>
          <p>Previous trading-day close: {formatNumber(quote.price)} {quote.currency}</p>
          <small style={{ fontSize: "0.875rem", color: "gray", opacity: 0.8 }}>
            {quote.exchange} · Massive · {quote.asOfDate} (US market date)</small>
          {oldQuote && <small className="holding-quote-warning">This closing price is over a week old. Check the ticker before relying on this estimate.</small>}
          <small style={{ fontSize: "0.875rem", color: "gray", opacity: 0.8 }}>
            End-of-day estimate, not live P&amp;L. Before fees, funding and taxes. Checks for updates every 15 minutes.
          </small>
        </>
      )}
    </div>
  );
}

export default UnrealizedPnl;
