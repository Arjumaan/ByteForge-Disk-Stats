// frontend/src/context/StatsContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import { io } from "socket.io-client";

const StatsContext = createContext();

export function StatsProvider({ children }) {
  const socketRef = useRef(null);

  const [latest, setLatest] = useState({ cpu: 0, ram: 0, time: null });
  const [history, setHistory] = useState([]);
  const [processTree, setProcessTree] = useState([]);
  const [events, setEvents] = useState([]);
  const [diskNetwork, setDiskNetwork] = useState({
    diskIO: {},
    fsSize: [],
    network: []
  });
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const SOCKET_URL =
      import.meta.env.VITE_BACKEND_URL || "/";

    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket", "polling"]
    });

    const s = socketRef.current;

    s.on("connect", () => {
      console.log("Stats Socket Connected:", s.id);
    });

    // ---- Live CPU/RAM Stats (Mapped from ByteForge system:stats) ----
    s.on("system:stats", (data) => {
      if (!data) return;

      const cpuVal = parseFloat(data.cpu.load);
      const ramVal = (data.memory.active / data.memory.total) * 100;

      const st = {
        time: data.timestamp,
        cpu: cpuVal,
        ram: Math.round(ramVal),
        uptime: data.uptime,
        battery: data.battery || {}
      };

      setLatest(st);

      setHistory((prev) => [
        ...prev.slice(-119),
        {
          time: new Date(st.time).toLocaleTimeString(),
          cpu: st.cpu,
          ram: st.ram
        }
      ]);
    });

    // ---- Process Tree (Optional if implemented in backend) ----
    s.on("processTree", (tree) => {
      if (!tree) return;
      setProcessTree(Array.isArray(tree) ? tree : [tree]);
    });

    // ---- Event Logs ----
    s.on("events", (ev) => {
      const arr = Array.isArray(ev) ? ev : [ev];

      setEvents((prev) =>
        [...arr.reverse(), ...prev].slice(0, 1000) // newest first
      );
    });

    // ---- Disk & Network ----
    s.on("diskNetwork", (dn) => setDiskNetwork(dn || {}));

    // ---- Live Logs ----
    s.on("liveLogs", (log) => {
      if (log)
        setEvents((prev) => [log, ...prev].slice(0, 1000));
    });

    // ---- Alerts ----
    s.on("alert", (alert) => {
      if (!alert) return;
      setAlerts((prev) => [alert, ...prev].slice(0, 50));
    });

    s.on("disconnect", () => {
      console.log("Socket Disconnected");
    });

    return () => {
      try {
        s.disconnect();
      } catch (_) { }
    };
  }, []);

  return (
    <StatsContext.Provider
      value={{ latest, history, processTree, events, diskNetwork, alerts }}
    >
      {children}
    </StatsContext.Provider>
  );
}

export const useStats = () => useContext(StatsContext);
