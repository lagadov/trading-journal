export const OPEN_POSITIONS_KEY = "pl-journal.open-positions.v1";

export function todayDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function validateOpenPosition(position) {
  if (!position || typeof position !== "object") return "Invalid position.";
  if (typeof position.symbol !== "string" || !position.symbol.trim()) {
    return "Enter an instrument or ticker.";
  }
  if (!["stock", "etf", "cfd", "other"].includes(position.assetType)) {
    return "Choose an instrument type.";
  }
  if (!["buy", "sell"].includes(position.side)) return "Choose Buy or Sell.";
  if (!Number.isFinite(position.quantity) || position.quantity <= 0) {
    return "Quantity must be greater than zero.";
  }
  if (!Number.isFinite(position.entryPrice) || position.entryPrice <= 0) {
    return "Entry price must be greater than zero.";
  }
  if (!/^[A-Z]{3}$/.test(position.currency ?? "")) {
    return "Enter a three-letter currency code, for example USD or EUR.";
  }
  const date = String(position.openDate ?? "");
  const parsed = new Date(`${date}T12:00:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== Number(date.slice(0, 4)) ||
    parsed.getMonth() + 1 !== Number(date.slice(5, 7)) ||
    parsed.getDate() !== Number(date.slice(8, 10)) || date > todayDate()) {
    return "Enter a valid opening date that is not in the future.";
  }
  return "";
}

export function loadOpenPositions(storage) {
  const raw = storage.getItem(OPEN_POSITIONS_KEY);
  if (raw === null) return [];
  const data = JSON.parse(raw);
  if (data?.version !== 1 || !Array.isArray(data.positions)) {
    throw new Error("Invalid saved positions.");
  }
  const ids = new Set();
  for (const position of data.positions) {
    if (validateOpenPosition(position) || typeof position.id !== "string" ||
      !position.id || ids.has(position.id) ||
      typeof position.exchange !== "string" || typeof position.broker !== "string") {
      throw new Error("Invalid saved position.");
    }
    ids.add(position.id);
  }
  return data.positions;
}

export function saveOpenPositions(storage, positions) {
  storage.setItem(OPEN_POSITIONS_KEY, JSON.stringify({ version: 1, positions }));
}
