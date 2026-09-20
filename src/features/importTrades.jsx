import "./importTrades.css";
import { useRef, useState } from "react";
import Papa from "papaparse";
import { normalizePlus500Trades } from "../utils/plus500Parser.js";
import { parsePlus500Date } from "../utils/tradeStatistics.js";

function ImportTrades({ onTradesImported, compact = false }) {
  const inputRef = useRef(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;
    // Allow selecting the same CSV again, including after a failed import.
    event.target.value = "";
    setStatus("");
    setError("");
    setImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) =>
        header.replace(/^\uFEFF/, "").trim(),

      complete: (results) => {
        setImporting(false);
        if (results.errors.length > 0) {
          setError("Could not read this CSV. Check the file and try again.");
          return;
        }

        try {
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
        setStatus(`Imported ${sortedTrades.length} ${sortedTrades.length === 1 ? "trade" : "trades"}.`);
        } catch {
          setError("Could not import these trades. Check that this is a Plus500 trades CSV.");
        }
      },
      error: () => {
        setImporting(false);
        setError("Could not open this file. Please try again.");
      },
    });
  };

  return (
    <div className={compact ? "import-trades-compact" : "container"}>
      {compact ? (
        <button className="import-trades-button" type="button" disabled={importing}
          onClick={() => inputRef.current?.click()}>
          {importing ? "Importing…" : "Import trades"}
        </button>
      ) : <h2>Import trades</h2>}

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        aria-label="Import trades CSV"
        hidden={compact}
        disabled={importing}
        onChange={handleFileChange}
      />
      {status && <p className="import-trades-status" role="status">{status}</p>}
      {error && <p className="import-trades-error" role="alert">{error}</p>}
    </div>
  );
}

export default ImportTrades;
