export function normalizePlus500Trade(row) {
  return {
    id: String(row.RealPositionID),

    broker: "plus500",

    symbol: row.Instrument,
    instrumentCurrency: row.InstrumentCurrency,

    side: row.BuySell.toLowerCase(),

    quantity: Number(row.Amount),

    initialMargin: Number(row.InitialMargin),

    entryPrice: Number(row.OpenRate),
    exitPrice: Number(row.CloseRate),

    openTime: row.OpenTime,
    closeTime: row.CloseTime,

    durationMinutes: Number(row.DurationInMin),

    grossPnl: Number(row.GrossPLInUserCurrency),
    netPnl: Number(row.NetPLInUserCurrency),

    overnightFunding: Number(
      row.OvernightFundingInUserCurrency
    ),

    currencyConversionFee: Number(
      row.CurrencyConversionFeeAmountInUserCurrency
    ),

    closeReason: row.CloseReason
  };
}
export function normalizePlus500Trades(rows) {
  return rows.map(normalizePlus500Trade);
}