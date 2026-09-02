import { useMemo, useState } from "react";
import "./calendar.css";
import CalendarView from "./calendarView.jsx";
import CalendarHeader from "./calendarHead.jsx";
import { parsePlus500Date } from "../../utils/tradeStatistics.js";

function Calendar({ trades = [] }) {
  


  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const previousMonth = () => {
    setCurrentDate((date) =>
      new Date(date.getFullYear(), date.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate((date) =>
      new Date(date.getFullYear(), date.getMonth() + 1, 1)
    );
  };

  const goToToday = () => setCurrentDate(new Date());

  const monthSummary = useMemo(() => {
    return trades.reduce(
      (summary, trade) => {
        const closeDate = parsePlus500Date(trade.closeTime);

        if (
          !Number.isNaN(closeDate.getTime()) &&
          closeDate.getFullYear() === year &&
          closeDate.getMonth() === month
        ) {
          summary.tradeCount += 1;
          summary.netPnl += Number.isFinite(trade.netPnl) ? trade.netPnl : 0;
        }

        return summary;
      },
      { tradeCount: 0, netPnl: 0 }
    );
  }, [month, trades, year]);

  return (
    <section className="calendar" aria-label="Trading calendar">
      <CalendarHeader
        year={year}
        month={month}
        previousMonth={previousMonth}
        nextMonth={nextMonth}
        goToToday={goToToday}
        tradeCount={monthSummary.tradeCount}
        netPnl={monthSummary.netPnl}
      />

      <CalendarView year={year} month={month} trades={trades} />
    </section>
  );
  <div className="space"></div>
}

export default Calendar;
