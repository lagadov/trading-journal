import { useState } from "react"
import "./App.css"
import Stats from "./features/stats.jsx"
import ImportTrades from "./features/importTrades.jsx"
import Calendar from "./features/calendar/calendar.jsx"
import PositionList from "./features/position_list/positionList.jsx"
import { loadOpenPositions, saveOpenPositions, validateOpenPosition } from "./utils/openPositions.js"

function App() {
  const [trades, setTrades] = useState([]);
  const [savedPositions, setSavedPositions] = useState(() => {
    try {
      return { positions: loadOpenPositions(window.localStorage), loadFailed: false };
    } catch {
      return { positions: [], loadFailed: true };
    }
  });
  const [storageError, setStorageError] = useState(savedPositions.loadFailed
    ? "Saved positions could not be read. Saving is disabled to protect existing data. Check browser storage access and reload."
    : "");

  function handleSaveOpenPosition(draft, id) {
    if (savedPositions.loadFailed) return false;
    const error = validateOpenPosition(draft);
    if (error) { setStorageError(error); return false; }
    try {
      if (id && !savedPositions.positions.some((position) => position.id === id)) {
        setStorageError("This position was not found. Reload and try again.");
        return false;
      }
      const position = { ...draft, id: id ?? crypto.randomUUID() };
      const positions = id
        ? savedPositions.positions.map((entry) => entry.id === id ? position : entry)
        : [...savedPositions.positions, position];
      saveOpenPositions(window.localStorage, positions);
      setSavedPositions({ positions, loadFailed: false });
      setStorageError("");
      return true;
    } catch {
      setStorageError("Could not save in this browser. Your form is still here; enable browser storage or free space and try again.");
      return false;
    }
  }

  function handleDeleteOpenPosition(id) {
    if (savedPositions.loadFailed) return false;
    if (!savedPositions.positions.some((position) => position.id === id)) {
      setStorageError("This position was not found. Reload and try again.");
      return false;
    }

    const positions = savedPositions.positions.filter((position) => position.id !== id);
    try {
      saveOpenPositions(window.localStorage, positions);
      setSavedPositions({ positions, loadFailed: false });
      setStorageError("");
      return true;
    } catch {
      setStorageError("Could not delete the position. It has been kept; please try again.");
      return false;
    }
  }

  return (
    <>
      <ImportTrades onTradesImported={setTrades} />
      <Stats trades={trades} openPositionRecords={savedPositions.positions} />
      <Calendar trades={trades} />
      <PositionList trades={trades} openPositions={savedPositions.positions}
        onTradesImported={setTrades}
        onSaveOpenPosition={handleSaveOpenPosition}
        onDeleteOpenPosition={handleDeleteOpenPosition} storageError={storageError} />
    </>
  );
}

export default App;
