import './stats.css'
import SalesChart from "./SalesCharts.jsx";
import upArrow from "../assets/up-arrow.png";
import downArrow from "../assets/down-arrow.png";

function Stats() {
  const netPl = 200;
  const isProfit = netPl >= 0;

  return (
    <div className="stats-page">
        <div className="stats-container">
            <div>
              <h3>NET P&L</h3>
              <h1
                id="net-pl"
                className={`net-pl ${isProfit ? "profit" : "loss"}`}
              >
                {isProfit ? "+" : "-"}${Math.abs(netPl)}
                <img
                  className="pnl-arrow"
                  src={isProfit ? upArrow : downArrow}
                  alt={isProfit ? "Up Arrow" : "Down Arrow"}
                />
              </h1>
            </div>
            
            <div style={{ paddingLeft: '26px' , paddingRight: '26px' }}><h3>Win Rate</h3> <h1> 80%</h1></div>

            <div><h3>Executed trades</h3> <h1> 11</h1></div>

            <div><h3>Balance</h3> <h1> $2,500</h1></div>

            <div><h3>Open positions</h3> <h1> 3 </h1></div>
        </div>

        <div className="chart-container">
          <h1>P&L Chart</h1>

          <SalesChart />
        </div>
    </div>
  )
}

export default Stats
