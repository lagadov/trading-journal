import { useMemo } from "react";
import { getCalendarDays, getDateKey } from "../../utils/calendarUtils.js";
import { parsePlus500Date } from "../../utils/tradeStatistics.js";
import CalendarDay from "./CalendarDay.jsx";
import "./calendarView.css";

function CalendarView({ year, month, trades = [] }) {
  const days = getCalendarDays(year, month);

  const tradeSummaryByDay = useMemo(() => {
    return trades.reduce((summary, trade) => {
      const tradeDate = parsePlus500Date(trade.closeTime);

      if (Number.isNaN(tradeDate.getTime())) {
        return summary;
      }

      const dateKey = getDateKey(tradeDate);
      const current = summary[dateKey] ?? { tradeCount: 0, netPnl: 0 };

      summary[dateKey] = {
        tradeCount: current.tradeCount + 1,
        netPnl: current.netPnl + (Number.isFinite(trade.netPnl) ? trade.netPnl : 0),
      };

      return summary;
    }, {});
  }, [trades]);

  const weekDays = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun"
  ];

  return (
    <div className="calendar-grid-scroll">
      <div className="calendar-grid">
        {weekDays.map((day) => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}

        {days.map((date, index) => (
        <CalendarDay
            key={getDateKey(date)}
            date={date}
            summary={tradeSummaryByDay[getDateKey(date)]}
            isOutsideMonth={
            date.getMonth() !== month ||
            date.getFullYear() !== year
        }
        />
        ))}
      </div>
    </div>
  );
}

export default CalendarView;
