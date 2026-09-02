import { useState } from "react"
import "./App.css"
import Stats from "./features/stats.jsx"
import ImportTrades from "./features/importTrades.jsx"
import Calendar from "./features/calendar/calendar.jsx"
import PositionList from "./features/position_list/positionList.jsx"

function App() {
  const [trades, setTrades] = useState([]);

  return (
    <>
      <ImportTrades onTradesImported={setTrades} />
      <Stats trades={trades} />
      <Calendar trades={trades} />
      <PositionList/>
    </>
  );
}

export default App;
