// frontend/src/pages/EventViewer.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import LoadingSkeleton from "../components/LoadingSkeleton";

export default function EventViewer() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const backend = import.meta.env.VITE_BACKEND_URL || "/api";

  useEffect(() => {
    axios
      .get(`${backend}/events`)
      .then((res) => {
        setEvents(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filterEvents = () => {
    if (filter === "all") return events;

    return events.filter((e) => {
      const type = e.EntryType?.toLowerCase() || "";
      return type.includes(filter);
    });
  };

  const badge = (type) => {
    const base = "px-3 py-1 rounded-full text-sm font-semibold";
    if (/error/i.test(type)) return base + " bg-red-600 text-white";
    if (/warn/i.test(type)) return base + " bg-yellow-400 text-black";
    return base + " bg-blue-600 text-white";
  };

  const filtered = filterEvents();

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Event Viewer</h1>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6">
        {["all", "error", "warning", "information"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1 rounded-lg border dark:border-gray-700 ${filter === f
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
              }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          <LoadingSkeleton height={80} />
          <LoadingSkeleton height={80} />
          <LoadingSkeleton height={80} />
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((e, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 p-5 shadow rounded-xl border dark:border-gray-700"
            >
              <div className="flex justify-between items-center">
                <span className={badge(e.EntryType)}>{e.EntryType}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {e.TimeCreated}
                </span>
              </div>

              <p className="mt-3 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {e.Message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
