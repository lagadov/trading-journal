import './stats.css'
import SalesChart from "./SalesCharts.jsx";
import upArrow from "../assets/up-arrow.png";
import downArrow from "../assets/down-arrow.png";
import {
  calculateStatistics
} from "../utils/tradeStatistics.js";


function Stats({ trades, openPositionRecords = [] }) {
  console.log(trades);
  
  const { netPnl, winRate, tradesThisWeek, balance, withdrawals, openPositions} = calculateStatistics(trades, 2125.08, 100, openPositionRecords);
  const isProfit = netPnl >= 0;

    return (
      <div className="stats-page">
        <div className="stats-container">
            <div>
              <h3>NET P&L</h3>
              <h1
                id="net-pl"
                className={`net-pl ${isProfit ? "profit" : "loss"}`}
              >
                {isProfit}€{Math.abs(netPnl).toFixed(2)}
               
              </h1>
            </div>

            <div style={{ paddingLeft: '26px' , paddingRight: '26px' }}><h3>Win Rate</h3> <h1> {winRate.toFixed(1)}%</h1></div>

            <div><h3>Executed trades this week</h3> <h1> {tradesThisWeek}</h1></div>

            <div><h3>Withdrawals</h3> <h1> €{withdrawals} </h1></div>

            <div><h3>Balance</h3> <h1> €{balance.toFixed(2)}</h1></div>

            <div><h3>Open positions</h3> <h1> {openPositions}</h1></div>
        </div>

        <div className="chart-container">
          <h1>P&L Chart</h1>

          <SalesChart />
        </div>
    </div>
  )
}

export default Stats
