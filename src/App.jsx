import { useState } from "react";
import "./App.css";
import Stats from "./features/stats.jsx";
import ImportTrades from "./features/importTrades.jsx";
import Calendar from "./features/calendar/calendar.jsx";

function App() {
  const [trades, setTrades] = useState([]);

  return (
    <>
      <ImportTrades onTradesImported={setTrades} />
      <Stats trades={trades} />
      <Calendar trades={trades} />
    </>
  );
}

export default App;
