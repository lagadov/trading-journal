export function calculateNetPnl(trades = []) {
  return trades.reduce((total, trade) => total + trade.netPnl, 0);
}

export function calculateWinRate(trades = []) {
  if (trades.length === 0) {
    return 0;
  }

  const winningTrades = trades.filter((trade) => trade.netPnl > 0);
  return (winningTrades.length / trades.length) * 100;
}

export function calculateBalance(
  startingBalance,
  trades = [],
  withdrawals = 0
) {
  return startingBalance + calculateNetPnl(trades) - withdrawals;
}

export function parsePlus500Date(dateString) {
  const match = String(dateString ?? "").match(
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s*г\.)?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/
  );

  if (!match) {
    return new Date(Number.NaN);
  }

  const [, day, month, year, hours, minutes, seconds = "0"] = match;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    Number(seconds)
  );
}

export function calculateTradesThisWeek(trades = []) {
  const now = new Date();
  const startOfWeek = new Date(now);
  const day = now.getDay();
  const difference = day === 0 ? -6 : 1 - day;

  startOfWeek.setDate(now.getDate() + difference);
  startOfWeek.setHours(0, 0, 0, 0);

  return trades.filter((trade) => {
    const tradeDate = parsePlus500Date(trade.closeTime);
    return tradeDate >= startOfWeek && tradeDate <= now;
  }).length;
}

export function calculateStatistics(
  trades = [],
  startingBalance = 0,
  withdrawals = 0,
  openPositions = []
) {
  return {
    netPnl: calculateNetPnl(trades),
    winRate: calculateWinRate(trades),
    balance: calculateBalance(startingBalance, trades, withdrawals),
    withdrawals,
    tradesThisWeek: calculateTradesThisWeek(trades),
    openPositions: openPositions.length,
  };
}
