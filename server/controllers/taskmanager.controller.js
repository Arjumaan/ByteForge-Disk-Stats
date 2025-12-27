// backend/controllers/systemController.js
const si = require("systeminformation");

/**
 * GET /system/stats
 * returns { cpu, ram, uptime, time }
 */
async function getSystemStats(req, res) {
  try {
    const cpuLoad = await si.currentLoad();
    const mem = await si.mem();
    const time = await si.time();

    const payload = {
      cpu: Number(cpuLoad.currentLoad.toFixed(2)),
      ram: Number(((mem.active / mem.total) * 100).toFixed(2)),
      uptime: Math.floor(time.uptime), // seconds
      time: new Date().toISOString(),
    };

    res.json(payload);
  } catch (err) {
    console.error("getSystemStats error:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /system/processes
 * returns an array of process objects:
 * [{ pid, ppid, name, cpu, mem, user }, ...]
 */
async function getProcesses(req, res) {
  try {
    const p = await si.processes();
    const list = (p && p.list) || [];

    const mapped = list.map((proc) => ({
      pid: proc.pid,
      ppid: proc.ppid,
      name: proc.name,
      cpu: Number((proc.cpu || 0).toFixed ? proc.cpu.toFixed(2) : proc.cpu || 0),
      mem: Number((proc.mem || 0).toFixed ? proc.mem.toFixed(2) : proc.mem || 0),
      user: proc.user || proc.username || null,
    }));

    // optional: sort by CPU desc
    mapped.sort((a, b) => (b.cpu || 0) - (a.cpu || 0));

    res.json(mapped);
  } catch (err) {
    console.error("getProcesses error:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getSystemStats,
  getProcesses,
};
