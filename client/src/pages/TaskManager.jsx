// frontend/src/pages/TaskManager.jsx
import { useState } from "react";
import axios from "axios";
import { useStats } from "../context/StatsContext";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ConfirmModal from "../components/ConfirmModal";
import { TabGroup, TabList, Tab, Badge } from '@tremor/react';
import { User, Shield, AlertTriangle, Activity } from 'lucide-react';

export default function TaskManager() {
  const { processTree } = useStats();
  const proc = processTree || [];
  const loading = proc.length === 0;

  const [search, setSearch] = useState("");
  const [view, setView] = useState(0); // 0: User, 1: System, 2: Heavy/Unwanted

  const [selected, setSelected] = useState(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toKill, setToKill] = useState(null);

  const [contextMenu, setContextMenu] = useState(null);

  const backend = import.meta.env.VITE_BACKEND_URL || "/api";

  const loadProcesses = () => {
    // Deprecated: using WebSocket data
  };

  const getFilteredProcesses = () => {
    let filtered = proc;

    // View Filtering
    if (view === 0) { // User Running Tasks
      // Heuristic: Not SYSTEM users, and usually higher PIDs (simplification, but user check is better)
      filtered = proc.filter(p => {
        const u = (p.user || "").toLowerCase();
        return u && !u.includes("system") && !u.includes("service") && !u.includes("network");
      });
    } else if (view === 1) { // System Default Tasks
      filtered = proc.filter(p => {
        const u = (p.user || "").toLowerCase();
        return !u || u.includes("system") || u.includes("service") || u.includes("network") || p.name === 'System';
      });
    } else if (view === 2) { // Unwanted / Heavy Tasks
      // Heuristic: High CPU or Memory usage
      filtered = proc.filter(p => p.cpu > 5 || p.mem > 5);
      // Or if user meant "Suspicious", hard to say. Stick to "High Resource".
    }

    // Search Filtering
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        String(p.pid).includes(q)
      );
    }

    return filtered;
  };

  const displayProcs = getFilteredProcesses();

  const toggleSelection = (pid) => {
    const next = new Set(selected);
    next.has(pid) ? next.delete(pid) : next.add(pid);
    setSelected(next);
  };

  const killProcess = async (pid) => {
    try {
      await axios.post(`${backend}/system/kill`, { pid });
    } catch (err) {
      alert("Kill failed: " + (err.response?.data?.error || err.message));
    }
  };

  const killBulk = async () => {
    try {
      for (const pid of toKill) {
        await killProcess(pid);
      }
      alert(`Kill requested for ${toKill.length} processes`);
    } catch (err) {
      alert("Bulk kill error: " + err.message);
    } finally {
      setSelected(new Set());
    }
  };

  const openContextMenu = (e, pid) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY, pid });
  };

  const closeContextMenu = () => setContextMenu(null);

  const getProcessIcon = (p) => {
    // Simple icon logic
    return <Activity size={16} className="text-slate-400" />;
  };

  return (
    <div onClick={closeContextMenu} className="animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold dark:text-white mb-1">Task Manager</h1>
          <p className="text-slate-500 text-sm">Monitor and manage system processes</p>
        </div>
        <div className="flex gap-2">
          <input
            placeholder="Search process…"
            className="p-2 border border-slate-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <TabGroup index={view} onIndexChange={setView} className="mb-6">
        <TabList variant="solid">
          <Tab icon={User}>User Tasks</Tab>
          <Tab icon={Shield}>System Tasks</Tab>
          <Tab icon={AlertTriangle}>High Impact / Unwanted</Tab>
        </TabList>
      </TabGroup>

      {selected.size > 0 && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <button
            onClick={() => {
              setToKill(Array.from(selected));
              setConfirmOpen(true);
            }}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105"
          >
            <span>Terminate {selected.size} Tasks</span>
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <LoadingSkeleton height={50} width="100%" />
          <LoadingSkeleton height={300} width="100%" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-gray-750 border-b border-slate-100 dark:border-gray-700 text-slate-500 font-medium">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <input type="checkbox" className="rounded border-slate-300"
                      checked={displayProcs.length > 0 && selected.size === displayProcs.length}
                      onChange={() => {
                        if (selected.size === displayProcs.length) setSelected(new Set());
                        else setSelected(new Set(displayProcs.map(p => p.pid)));
                      }}
                    />
                  </th>
                  <th className="p-4 text-left">Process Name</th>
                  <th className="p-4 text-left">User</th>
                  <th className="p-4 text-left">PID</th>
                  <th className="p-4 text-left">CPU</th>
                  <th className="p-4 text-left">Memory</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50 dark:divide-gray-700">
                {displayProcs.length > 0 ? (
                  displayProcs.map((p) => (
                    <tr
                      key={p.pid}
                      className={`group hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors ${selected.has(p.pid) ? 'bg-blue-50/80' : ''}`}
                      onContextMenu={(e) => openContextMenu(e, p.pid)}
                      onClick={() => toggleSelection(p.pid)}
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={selected.has(p.pid)}
                          onChange={() => toggleSelection(p.pid)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 font-mono text-xs shrink-0 uppercase">
                            {p.name.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white break-all">{p.name}</div>
                            {view === 2 && (p.cpu > 20 || p.mem > 50) && (
                              <span className="text-[10px] text-amber-600 flex items-center gap-1">
                                <AlertTriangle size={10} /> High Resource Usage
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-slate-500">{p.user || "System"}</td>
                      <td className="p-4 font-mono text-slate-400">{p.pid}</td>

                      <td className="p-4">
                        <span
                          className={`font-semibold ${p.cpu > 50
                            ? "text-red-600"
                            : p.cpu > 20
                              ? "text-amber-500"
                              : "text-slate-600"
                            }`}
                        >
                          {p.cpu.toFixed(1)}%
                        </span>
                      </td>

                      <td className="p-4 font-mono text-slate-600">{p.mem.toFixed(1)}%</td>

                      <td className="p-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setToKill([p.pid]);
                            setConfirmOpen(true);
                          }}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        >
                          End Task
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>No processes found in this category.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-xl rounded-lg py-1 text-sm z-50 min-w-[150px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="w-full px-4 py-2.5 text-left hover:bg-red-50 text-red-600 flex items-center gap-2"
            onClick={() => {
              setToKill([contextMenu.pid]);
              setConfirmOpen(true);
              closeContextMenu();
            }}
          >
            <AlertTriangle size={14} /> End Task
          </button>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Terminate Process"
        message={
          Array.isArray(toKill)
            ? `Are you sure you want to force stop ${toKill.length} process(es)? Unsaved data may be lost.`
            : `Are you sure you want to force stop process ${toKill}?`
        }
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false);
          if (Array.isArray(toKill)) await killBulk();
          else await killProcess(toKill);
        }}
      />
    </div>
  );
}
