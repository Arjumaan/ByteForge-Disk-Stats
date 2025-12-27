// frontend/src/components/UptimeBanner.jsx
import { useEffect, useState } from "react";
import { useStats } from "../context/StatsContext";

export default function UptimeBanner() {
  const { latest } = useStats();
  const [fallback, setFallback] = useState(0);

  // Fallback timer (in case backend hasn't sent uptime yet)
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setFallback(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const uptimeSec = latest?.uptime ?? fallback;

  const format = (s) => {
    s = Math.floor(s);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
  };

  return (
    <div className="w-full bg-blue-100 dark:bg-blue-900/40 p-4 px-6 rounded-lg shadow mb-6 border border-blue-300 dark:border-blue-800 flex items-center gap-3 animate-fadeIn">
      <span className="text-blue-800 dark:text-blue-200 font-bold text-lg">⏱</span>
      <p className="font-medium text-blue-800 dark:text-blue-200">
        System Uptime: <span className="font-bold">{format(uptimeSec)}</span>
      </p>
    </div>
  );
}
