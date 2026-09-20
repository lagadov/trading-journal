import { useState } from "react";
import "./positionList.css";
import Position from "./position.jsx";
import OpenPositions from "./OpenPositions.jsx";
import { filterPositionHistory } from "../../utils/positionHistory.js";

const periods = [
  ["today", "Today"],
  ["month", "This month"],
  ["year", "This year"],
  ["all", "All"],
];

function PositionList({
  trades = [],
  openPositions = [],
  onSaveOpenPosition,
  onDeleteOpenPosition,
  storageError,
}) {
  const [period, setPeriod] = useState("all");
  const visibleTrades = filterPositionHistory(trades, period);

  return (
    <section className="lists-page" aria-label="Positions">
      <div className="lists-container">
        <OpenPositions
          positions={openPositions}
          onSave={onSaveOpenPosition}
          onDelete={onDeleteOpenPosition}
          storageError={storageError}
        />

        <section className="list-closed" aria-labelledby="position-history-title">
          <header className="positions-heading">
            <h2 id="position-history-title">Position history</h2>
            <span aria-live="polite">
              {visibleTrades.length} {visibleTrades.length === 1 ? "position" : "positions"}
            </span>
          </header>

          <div className="positions-filters" role="group" aria-label="History period">
            {periods.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={period === value}
                onClick={() => setPeriod(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="positions-help">By closing date, newest first. Net P&amp;L in EUR.</p>

          {visibleTrades.length > 0 ? (
            <div className="positions-table-scroll">
              <table className="positions-table">
                <caption className="positions-sr-only">Closed positions</caption>
                <thead>
                  <tr>
                    <th scope="col">Direction</th>
                    <th scope="col">Quantity</th>
                    <th scope="col">Opened</th>
                    <th scope="col">Closed</th>
                    <th scope="col">Net P&amp;L</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTrades.map((trade, index) => (
                    <Position key={`${trade.broker}-${trade.id}-${index}`} trade={trade} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="positions-empty" role="status">
              {trades.length === 0
                ? "Import your trades CSV to see your position history."
                : "No closed positions in this period. Choose All to see your imported history."}
            </p>
          )}
        </section>
      </div>
    </section>
  );
}

export default PositionList;
