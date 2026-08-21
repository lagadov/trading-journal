import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  Title,
  Tooltip,
  PointElement,
  Legend,
} from "chart.js";

import { useState } from "react";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

function SalesChart() {
  const [period, setPeriod] = useState("monthly");

  const chartData = {
    monthly: {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      values: [120, 180, 140, 250],
    },

    yearly: {
      labels: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ],
      values: [120, 250, 180, 320, 290, 410, 380, 470, 450, 520, 490, 600],
    },
  };

  const selectedData = chartData[period];

  const data = {
    labels: selectedData.labels,

    datasets: [
      {
        label: period === "monthly" ? "Monthly P&L" : "Yearly P&L",
        data: selectedData.values,
        borderColor: "rgb(54, 162, 235)",
        backgroundColor: "rgba(54, 162, 235, 0.25)",
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 4,
      },
    ],
  };

  const options = {
  responsive: true,
  maintainAspectRatio: false,

  plugins: {
      legend: {
        position: "top",
      },

      title: {
        display: true,
        text: period === "monthly" ? "Monthly Performance" : "Yearly Performance",
      },
    },
  };

 return (
  <div className="sales-chart">
    <div className="chart-controls">
      <button onClick={() => setPeriod("monthly")}>
        Monthly
      </button>

      <button onClick={() => setPeriod("yearly")}>
        Yearly
      </button>
    </div>

    <div className="chart-wrapper">
      <Line data={data} options={options} />
    </div>
  </div>
);
}
export default SalesChart;