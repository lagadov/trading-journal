import { parsePlus500Date } from "./tradeStatistics.js";

export function filterPositionHistory(trades, period, now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = period === "today"
    ? new Date(year, month, now.getDate())
    : period === "month" ? new Date(year, month, 1) : new Date(year, 0, 1);
  const end = period === "today"
    ? new Date(year, month, now.getDate() + 1)
    : period === "month" ? new Date(year, month + 1, 1) : new Date(year + 1, 0, 1);

  return trades
    .map((trade) => ({ trade, date: parsePlus500Date(trade.closeTime) }))
    .filter(({ date }) => period === "all" || (date >= start && date < end))
    .sort((a, b) => {
      const aTime = a.date.getTime();
      const bTime = b.date.getTime();
      if (Number.isNaN(aTime)) return Number.isNaN(bTime) ? 0 : 1;
      if (Number.isNaN(bTime)) return -1;
      return bTime - aTime;
    })
    .map(({ trade }) => trade);
}
