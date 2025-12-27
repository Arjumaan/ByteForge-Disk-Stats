// frontend/src/components/LogItem.jsx
export default function LogItem({ ev }) {
  const level = (ev.LevelDisplayName || ev.EntryType || "").toLowerCase();

  const color =
    level.includes("error")
      ? "bg-red-600 text-white"
      : level.includes("warning")
      ? "bg-yellow-400 text-black"
      : "bg-blue-600 text-white";

  const time = ev.TimeCreated || ev.time || "";
  const message = ev.Message || ev.message || JSON.stringify(ev);

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow border dark:border-gray-700">
      <div className="flex justify-between items-center">
        <span className={`px-3 py-1 rounded-full text-sm ${color}`}>
          {(ev.LevelDisplayName || "INFO").toUpperCase()}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{time}</span>
      </div>

      <p className="mt-2 text-sm dark:text-gray-200 whitespace-pre-wrap">
        {message}
      </p>
    </div>
  );
}
