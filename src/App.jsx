import { useState } from "react";
import "./App.css";
import Stats from "./pages/stats.jsx";
import ImportTrades from "./pages/importTrades.jsx";

function App() {
  const [trades, setTrades] = useState([]);

  return (
    <>
      <ImportTrades onTradesImported={setTrades} />
      <Stats trades={trades} />
    </>
  );
}

export default App;
