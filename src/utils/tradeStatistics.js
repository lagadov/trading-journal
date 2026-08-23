export function calculateNetPnl(trades) {
  return trades.reduce(
    (total, trade) => total + trade.netPnl,
    0
  );
}

export function calculateWinRate(trades) {
  if (trades.length === 0) {
    return 0;
  }

  const winningTrades = trades.filter(
    (trade) => trade.netPnl > 0
  );

  return (
    winningTrades.length /
    trades.length
  ) * 100;
}

export function calculateBalance(
    
  startingBalance,
  trades,
  withdrawals
) {
  return (
    startingBalance +
    calculateNetPnl(trades)
    - withdrawals
  );
}

export function parsePlus500Date(dateString) {
  const cleaned = dateString.replace(" г.", "");

  const [datePart, timePart] = cleaned.split(" ");

  const [day, month, year] = datePart
    .split(".")
    .map(Number);

  const [hours, minutes, seconds] = timePart
    .split(":")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
    hours,
    minutes,
    seconds
  );
}

export function calculateTradesThisWeek(trades) {
  const now = new Date();

  const startOfWeek = new Date(now);

  const day = now.getDay();

  const difference =
    day === 0 ? -6 : 1 - day;

  startOfWeek.setDate(
    now.getDate() + difference
  );

  startOfWeek.setHours(0, 0, 0, 0);

  return trades.filter((trade) => {
    const tradeDate =
      parsePlus500Date(trade.closeTime);

    return (
      tradeDate >= startOfWeek &&
      tradeDate <= now
    );
  }).length;
}

export function calculateStatistics(
  trades,
  startingBalance,
  withdrawals,
  openPositions = []
) {
  return {
    netPnl:
      calculateNetPnl(trades),

    winRate:
      calculateWinRate(trades),

    balance:
      calculateBalance(
        startingBalance,
        trades,
        withdrawals
      ),

    withdrawals:
      withdrawals,

    tradesThisWeek:
      calculateTradesThisWeek(trades),

    openPositions:
      openPositions.length
  };
}