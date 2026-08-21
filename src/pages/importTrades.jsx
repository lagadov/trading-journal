import './importTrades.css'
import Papa from "papaparse";

function ImportTrades() {
  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,

      complete: (results) => {
        console.log(results.data);
      }
    });
  };
  
  return (
    <div className="container">
      <h2>Import trades</h2>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
      />
    </div>
  );
}

export default ImportTrades;