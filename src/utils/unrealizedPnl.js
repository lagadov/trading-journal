import { normalizeExchange } from "./marketExchange.js";

// Stocks/ETFs only: CFD contract sizes and broker-specific charges are not available.
export function calculateUnrealizedPnl(position, quote) {
  if (!["stock", "etf"].includes(position.assetType)) {
    return { error: "This instrument needs broker-specific valuation." };
  }
  if (!quote || !Number.isFinite(quote.price) || quote.price <= 0) {
    return { error: "A market price is not available yet." };
  }
  if (quote.symbol.toUpperCase() !== position.symbol.trim().toUpperCase()) {
    return { error: "The quote does not match this ticker. Edit the holding to use its market ticker." };
  }
  if (quote.currency !== position.currency) {
    return { error: `Quote is in ${quote.currency}; entry is in ${position.currency}. Matching currencies are required.` };
  }
  if (position.exchange.trim() && normalizeExchange(position.exchange) !== normalizeExchange(quote.exchange)) {
    return { error: "The quote exchange does not match this holding." };
  }
  if (quote.priceType === "previous_close" && quote.asOfDate && position.openDate > quote.asOfDate) {
    return { error: "This closing price is from before you opened the position. Wait for the next daily price." };
  }
  if (!["buy", "sell"].includes(position.side) ||
    !Number.isFinite(position.entryPrice) || position.entryPrice <= 0 ||
    !Number.isFinite(position.quantity) || position.quantity <= 0) {
    return { error: "Check this holding's direction, entry price and quantity." };
  }
  const difference = (quote.price - position.entryPrice) * (position.side === "sell" ? -1 : 1);
  const amount = difference * position.quantity;
  const percent = difference / position.entryPrice * 100;
  if (!Number.isFinite(amount) || !Number.isFinite(percent)) {
    return { error: "The position values are too large to calculate." };
  }
  return { amount, percent, currency: position.currency };
}
