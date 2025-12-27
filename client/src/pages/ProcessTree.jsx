// frontend/src/pages/ProcessTree.jsx
import { useState } from "react";
import { useStats } from "../context/StatsContext";
import axios from "axios";
import { motion } from "framer-motion";
import ConfirmModal from "../components/ConfirmModal";
import { TabGroup, TabList, Tab } from '@tremor/react';
import { User, Shield, AlertTriangle, Activity } from 'lucide-react';

export default function ProcessTree() {
  const { processTree = [] } = useStats(); // Default to empty array
  const [query, setQuery] = useState("");
  const [view, setView] = useState(0); // 0: User, 1: System, 2: Heavy
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toKill, setToKill] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const backend = import.meta.env.VITE_BACKEND_URL || "/api";

  const killProcess = async (pid) => {
    try {
      await axios.post(`${backend}/system/kill`, { pid });
    } catch (err) {
      alert("Kill failed: " + (err.response?.data?.error || err.message));
    }
  };

  const getFilteredTree = () => {
    // 1. Filter by Category (top-level only for now to preserve tree structure of chosen roots)
    let nodes = processTree;

    if (view === 0) { // User
      nodes = nodes.filter(p => {
        const u = (p.user || "").toLowerCase();
        // Include if user is NOT system/service
        return u && !u.includes("system") && !u.includes("service") && !u.includes("network");
      });
    } else if (view === 1) { // System
      nodes = nodes.filter(p => {
        const u = (p.user || "").toLowerCase();
        return !u || u.includes("system") || u.includes("service") || u.includes("network") || p.name === 'System';
      });
    } else if (view === 2) { // Heavy
      // Heuristic: Check if node OR any child is heavy? 
      // For simplicity, check root. Or flatten. 
      // TaskManager used flat list. Here tree. 
      // Let's filter roots that are heavy.
      nodes = nodes.filter(p => (p.cpu || 0) > 1 || (p.mem || 0) > 1);
    }

    // 2. Filter by Search Query
    if (query) {
      const q = query.toLowerCase();
      // Recursive search could be better, but simple top-level + name check for now
      // Or simple flatten check?
      // Let's stick to the previous logic:
      nodes = nodes.filter(node =>
        node.name?.toLowerCase().includes(q) ||
        String(node.pid).includes(q)
      );
    }

    return nodes;
  };

  const visibleNodes = getFilteredTree();

  const openContextMenu = (e, pid) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY, pid });
  };

  const closeContextMenu = () => setContextMenu(null);

  return (
    <div onClick={closeContextMenu} className="animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold dark:text-white mb-1">Process Tree</h1>
          <p className="text-slate-500 text-sm">Hierarchical view of running processes</p>
        </div>
        <div className="flex gap-2">
          <input
            placeholder="Search processes..."
            className="p-2 border border-slate-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <TabGroup index={view} onIndexChange={setView} className="mb-6">
        <TabList variant="solid">
          <Tab icon={User}>User Tasks</Tab>
          <Tab icon={Shield}>System Tasks</Tab>
          <Tab icon={AlertTriangle}>High Impact</Tab>
        </TabList>
      </TabGroup>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow ring-1 ring-slate-200 dark:ring-gray-700 min-h-[300px]">
        {visibleNodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Activity className="w-12 h-12 mb-3 opacity-20" />
            <p>No processes found in this category.</p>
          </div>
        ) : (
          visibleNodes.map((node) => (
            <Node
              key={node.pid}
              node={node}
              onKill={(pid) => {
                setToKill(pid);
                setConfirmOpen(true);
              }}
              openContextMenu={openContextMenu}
            />
          ))
        )}
      </div>

      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-xl rounded-lg py-1 text-sm z-50 min-w-[150px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="w-full px-4 py-2.5 text-left hover:bg-red-50 text-red-600 flex items-center gap-2"
            onClick={() => {
              setToKill(contextMenu.pid);
              setConfirmOpen(true);
              closeContextMenu();
            }}
          >
            <AlertTriangle size={14} /> Kill Process Tree
          </button>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Terminate Process"
        message={`Are you sure you want to force stop process ${toKill}?`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          await killProcess(toKill);
          setConfirmOpen(false);
        }}
      />
    </div>
  );
}

function Node({ node, onKill, openContextMenu }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="pl-4">
      <div
        className="flex items-center justify-between py-1 cursor-pointer"
        onContextMenu={(e) => openContextMenu(e, node.pid)}
      >
        <div className="flex items-center gap-2">
          {node.children?.length > 0 && (
            <button onClick={() => setOpen(!open)}>
              {open ? "▾" : "▸"}
            </button>
          )}

          <div>
            <div className="font-semibold dark:text-white">
              {node.name}{" "}
              <span className="text-xs text-gray-500">
                ({node.pid})
              </span>
            </div>
            <div className="text-xs text-gray-500">{node.user}</div>
          </div>
        </div>

        <button
          onClick={() => onKill(node.pid)}
          className="px-2 py-1 bg-red-600 text-white rounded text-sm"
        >
          Kill
        </button>
      </div>

      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        style={{ overflow: "hidden" }}
      >
        <div className="ml-5 border-l pl-3">
          {node.children?.map((c) => (
            <Node
              key={c.pid}
              node={c}
              onKill={onKill}
              openContextMenu={openContextMenu}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
