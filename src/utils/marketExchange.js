// Massive identifies the primary listing venue with an ISO MIC.
// Keep existing holdings using friendly exchange names compatible.
export function normalizeExchange(exchange) {
  const normalized = String(exchange ?? "").trim().toUpperCase();
  return { NASDAQ: "XNAS", NYSE: "XNYS" }[normalized] ?? normalized;
}
