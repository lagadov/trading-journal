import "./importTrades.css";
import Papa from "papaparse";
import { normalizePlus500Trades } from "../utils/plus500Parser.js";
import { parsePlus500Date } from "../utils/tradeStatistics.js";

function ImportTrades({ onTradesImported }) {
  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) =>
        header.replace(/^\uFEFF/, "").trim(),

      complete: (results) => {
        if (results.errors.length > 0) {
          console.error("CSV errors:", results.errors);
          return;
        }

        const normalizedTrades =
          normalizePlus500Trades(results.data);

        const filteredTrades = normalizedTrades.filter(
          (trade) =>
            trade.id !== "undefined" &&
            trade.symbol &&
            trade.closeTime &&
            Number.isFinite(trade.netPnl)
        );

        // Newest closed trade first
        const sortedTrades = [...filteredTrades].sort(
          (a, b) =>
            parsePlus500Date(b.closeTime) -
            parsePlus500Date(a.closeTime)
        );

        onTradesImported(sortedTrades);
      },
    });
  };

  return (
    <div className="container">
      <h2>Import trades</h2>

      <input
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileChange}
      />
    </div>
  );
}

export default ImportTrades;