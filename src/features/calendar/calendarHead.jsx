function CalendarHeader({
  year,
  month,
  previousMonth,
  nextMonth,
  goToToday,
  tradeCount,
  netPnl,
}) {
  const monthName = new Date(year, month).toLocaleString("en-US", {
    month: "long",
  });

  return (
    <header className="calendar-header">
      <div className="calendar-title">
        <p>Trading journal</p>
        <h2>{monthName} {year}</h2>
      </div>

      <div className="calendar-month-summary">
        <span>{tradeCount} {tradeCount === 1 ? "trade" : "trades"}</span>
        <strong className={netPnl >= 0 ? "profit" : "loss"}>
          {netPnl >= 0 ? "+" : "-"}{"\u20AC"}{Math.abs(netPnl).toFixed(2)}
        </strong>
      </div>

      <nav className="calendar-navigation" aria-label="Calendar navigation">
        <button type="button" onClick={previousMonth} aria-label="Previous month">
          &lsaquo;
        </button>
        <button type="button" className="today-button" onClick={goToToday}>
          Today
        </button>
        <button type="button" onClick={nextMonth} aria-label="Next month">
          &rsaquo;
        </button>
      </nav>
    </header>
  );
}

export default CalendarHeader;
