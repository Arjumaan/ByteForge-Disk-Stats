// frontend/src/components/Alerts.jsx
import React, { useEffect, useState } from "react";
import { useStats } from "../context/StatsContext";

export default function Alerts() {
  const { alerts } = useStats();
  const [visibleAlerts, setVisibleAlerts] = useState([]);

  useEffect(() => {
    if (!alerts || alerts.length === 0) return;
    const newest = alerts[0];
    setVisibleAlerts((prev) => [newest, ...prev].slice(0, 4));

    // Auto-remove after 10 seconds
    const timer = setTimeout(() => {
      setVisibleAlerts((prev) => prev.slice(1));
    }, 10000);

    return () => clearTimeout(timer);
  }, [alerts]);

  if (visibleAlerts.length === 0) return null;

  const color = (type) => {
    if (type === "cpu") return "bg-red-600";
    if (type === "ram") return "bg-yellow-500 text-black";
    return "bg-blue-600";
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3">
      {visibleAlerts.map((a, i) => (
        <div
          key={i}
          className={`p-4 rounded-lg shadow-lg text-white animate-slideIn ${color(a.type)}`}
        >
          <div className="font-bold">{(a.type || "ALERT").toUpperCase()}</div>
          <div className="text-sm opacity-90">{a.message}</div>
        </div>
      ))}
    </div>
  );
}
