// frontend/src/pages/LogsLive.jsx
import React, { useEffect, useRef, useState } from "react";
import { useStats } from "../context/StatsContext";

export default function LogsLive() {
  const { events } = useStats();
  const [filter, setFilter] = useState("");
  const [initialLogs, setInitialLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef();

  const backend = import.meta.env.VITE_BACKEND_URL || "/api";

  useEffect(() => {
    // Fetch initial history
    const fetchHistory = async () => {
      try {
        // import axios dynamically or assume it's available?
        // Since this file didn't import axios, need to add import or use fetch.
        // I'll add axios to imports at top in next step or use fetch.
        const res = await fetch(`${backend}/events`);
        const data = await res.json();
        if (Array.isArray(data)) setInitialLogs(data);
      } catch (e) { console.error("History fetch error", e); }
      finally { setIsLoading(false); }
    };
    fetchHistory();
  }, []);

  // Merge events: Context events (live) + Initial (history)
  // Deduplicate by RecordId or simple ID if possible
  const allLogs = [...(events || []), ...initialLogs].reduce((acc, current) => {
    const x = acc.find(item => (item.RecordId && item.RecordId === current.RecordId) || (item.time === current.time && item.Message === current.Message));
    if (!x) return acc.concat([current]);
    return acc;
  }, []).sort((a, b) => {
    // Sort by Time descending (newest first)
    const tA = new Date(a.TimeCreated || a.time);
    const tB = new Date(b.TimeCreated || b.time);
    return tB - tA;
  });

  const filtered = allLogs.filter((e) => {
    const m = e.Message || e.message || JSON.stringify(e);
    return m.toLowerCase().includes(filter.toLowerCase());
  }).slice(0, 1000); // Limit display

  useEffect(() => {
    // Scroll logic might need adjustment if sorting is newest at top?
    // If List is Newest First, top is start.
    // Usually logs are Newest First.
  }, [false]); // Disable auto-scroll to bottom for now as it's confusing if list is reversed

  const levelColor = (e) => {
    const msg = e.LevelDisplayName || e.EntryType || "";
    if (/error/i.test(msg)) return "text-red-500 font-semibold";
    if (/warn/i.test(msg)) return "text-yellow-500 font-semibold";
    return "text-blue-500 font-semibold";
  };

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold mb-4 dark:text-white">Live Logs</h1>

      <input
        className="p-3 border rounded w-full mb-4 dark:bg-gray-900 dark:text-white"
        placeholder="Search logs…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <div
        ref={scrollRef}
        className="space-y-3 max-h-[65vh] overflow-y-auto pr-2"
      >
        {filtered.map((ev, i) => {
          const text = ev.Message || ev.message || JSON.stringify(ev);
          const time =
            ev.TimeCreated || ev.time || new Date().toLocaleTimeString();

          return (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border dark:border-gray-700"
            >
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {time}
                </span>
                <span className={levelColor(ev)}>
                  {ev.LevelDisplayName || ev.EntryType || "Info"}
                </span>
              </div>
              <div className="mt-2 dark:text-gray-200">{text}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
