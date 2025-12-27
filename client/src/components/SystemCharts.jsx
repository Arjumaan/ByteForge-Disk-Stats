// frontend/src/components/SystemCharts.jsx
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { useStats } from "../context/StatsContext";

export default function SystemCharts() {
  const { history } = useStats();

  const safeData = Array.isArray(history) ? history : [];

  return (
    <div className="mt-10 bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">
        Live System Charts
      </h2>

      {/* Chart container for screenshot capture */}
      <div
        id="chart-root"
        className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border dark:border-gray-700"
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={safeData}>
            <XAxis dataKey="time" stroke="#888" />
            <YAxis domain={[0, 100]} stroke="#888" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "none",
                color: "#fff"
              }}
            />
            <Legend />

            {/* CPU line */}
            <Line
              type="monotone"
              dataKey="cpu"
              stroke="#3b82f6"          // Blue
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
            />

            {/* RAM line */}
            <Line
              type="monotone"
              dataKey="ram"
              stroke="#22c55e"          // Green
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
