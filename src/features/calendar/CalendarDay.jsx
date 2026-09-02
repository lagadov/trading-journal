

function CalendarDay({ date, summary, isOutsideMonth }) {
  if (!date) {
    return <div className="calendar-day empty" aria-hidden="true" />;
  }

  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  return (
    <article className={`calendar-day${isToday ? " today" : ""}  ${isOutsideMonth ? "outside-month" : ""}`}>
      <div className="calendar-day-header">
        <span className="calendar-day-number">{date.getDate()}</span>
        {isToday && <span className="calendar-today-label">Today</span>}
      </div>

      {summary ? (
        <div className="calendar-day-summary">
          <span>
            {summary.tradeCount} {summary.tradeCount === 1 ? "trade" : "trades"}
          </span>
          <strong className={summary.netPnl >= 0 ? "profit" : "loss"}>
            {summary.netPnl >= 0 ? "+" : "-"}{"\u20AC"}
            {Math.abs(summary.netPnl).toFixed(2)}
          </strong>
        </div>
      ) : (
        <span className="calendar-no-trades">No trades</span>
      )}
    </article>
  );
}

export default CalendarDay;
