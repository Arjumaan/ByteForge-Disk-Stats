// frontend/src/components/Gauges.jsx
import React from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { useStats } from "../context/StatsContext";

export default function Gauges() {
  const { latest } = useStats();

  const cpu = latest?.cpu ?? 0;
  const ram = latest?.ram ?? 0;

  const getColor = (val) => {
    if (val >= 80) return "#dc2626";       // red
    if (val >= 60) return "#f59e0b";       // yellow
    return "#22c55e";                      // green
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 animate-fadeIn">

      {/* CPU Gauge */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex items-center border dark:border-gray-700">
        <div
          style={{ width: 130, height: 130 }}
          className="transition-transform duration-300"
        >
          <CircularProgressbar
            value={cpu}
            text={`${cpu}%`}
            maxValue={100}
            styles={buildStyles({
              textColor: getColor(cpu),
              pathColor: getColor(cpu),
              trailColor: "#e5e7eb",
              textSize: "16px",
              pathTransitionDuration: 0.5,
            })}
          />
        </div>

        <div className="ml-6">
          <h4 className="text-lg font-semibold dark:text-white">CPU</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Live CPU Usage
          </p>
        </div>
      </div>

      {/* RAM Gauge */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex items-center border dark:border-gray-700">
        <div style={{ width: 130, height: 130 }}>
          <CircularProgressbar
            value={ram}
            text={`${ram}%`}
            maxValue={100}
            styles={buildStyles({
              textColor: getColor(ram),
              pathColor: getColor(ram),
              trailColor: "#e5e7eb",
              textSize: "16px",
              pathTransitionDuration: 0.5,
            })}
          />
        </div>

        <div className="ml-6">
          <h4 className="text-lg font-semibold dark:text-white">RAM</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Live RAM Usage
          </p>
        </div>
      </div>
    </div>
  );
}
