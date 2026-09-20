import { parsePlus500Date } from "../../utils/tradeStatistics.js";

const money = new Intl.NumberFormat("en-IE", {
  style: "currency",
  currency: "EUR",
  signDisplay: "exceptZero",
});

function formatDate(value) {
  const date = parsePlus500Date(value);
  if (Number.isNaN(date.getTime())) return value || "Unavailable";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Position({ trade }) {
  const side = String(trade.side ?? "").trim().toLowerCase();
  const direction = side === "buy" ? "Buy" : side === "sell" ? "Sell" : "Unknown";
  const pnlClass = trade.netPnl > 0 ? "position-profit" : trade.netPnl < 0 ? "position-loss" : "";

  return (
    <tr className="position">
      <td><span className={`position-direction ${side === "buy" ? "position-buy" : side === "sell" ? "position-sell" : ""}`}>{direction}</span></td>
      <td>{Number.isFinite(trade.quantity) ? String(trade.quantity) : "Unavailable"}</td>
      <td>{formatDate(trade.openTime)}</td>
      <td>{formatDate(trade.closeTime)}</td>
      <td className={pnlClass}>
        {Number.isFinite(trade.netPnl) ? money.format(trade.netPnl) : "Unavailable"}
      </td>
    </tr>
  );
}

export default Position;
