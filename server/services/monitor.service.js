const si = require('systeminformation');
const historyService = require('./history.service');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

let intervalId = null;
let historyIntervalId = null;
let heavyIntervalId = null;
let logIntervalId = null;
let slowIntervalId = null;
let seenLogKeys = new Set();
let cachedFsSize = [];

exports.startMonitoring = (io) => {
    if (intervalId) return;

    // 1. Start Real-time Monitor (2s)
    intervalId = setInterval(async () => {
        try {
            // Fetch metrics independently to fail gracefully
            let cpu = { currentLoad: 0, cpus: [] };
            let mem = { total: 0, used: 0, active: 0, available: 0 };
            let ioStats = { rIO: 0, wIO: 0, tIO: 0 };

            try { cpu = await si.currentLoad(); } catch (e) { console.error("CPU err:", e.message); }
            try { mem = await si.mem(); } catch (e) { console.error("Mem err:", e.message); }
            try { ioStats = await si.disksIO(); } catch (e) { console.error("IO err:", e.message); }

            // fsSize is heavy and redundant with "loadDisks", skipping for high-freq stats

            // Battery Stats
            let battery = await si.battery().catch(() => ({ hasBattery: false }));

            // Fallback for TimeRemaining if missing and discharging
            if (battery.hasBattery && !battery.acConnected && (!battery.timeRemaining || battery.timeRemaining < 0)) {
                try {
                    const { stdout } = await execAsync('powershell -NoProfile -Command "(Get-CimInstance -ClassName Win32_Battery).EstimatedRunTime"');
                    const runTime = parseInt(stdout.trim());
                    if (!isNaN(runTime) && runTime > 0 && runTime < 1000000) { // 71582788 is "unknown" code
                        battery.timeRemaining = runTime;
                    }
                } catch (e) { /* ignore */ }
            }

            const data = {
                timestamp: Date.now(),
                battery, // Add battery info
                cpu: {
                    load: (cpu.currentLoad || 0).toFixed(2),
                },
                memory: {
                    total: mem.total || 1,
                    active: mem.active || 0,
                },
                io: {
                    rIO: ioStats ? (ioStats.rIO || 0) : 0,
                    wIO: ioStats ? (ioStats.wIO || 0) : 0,
                },
                uptime: require('os').uptime()
            };

            io.emit('system:stats', data);
        } catch (error) {
            console.error("Monitoring loop critical error:", error);
        }
    }, 1000);

    // 2. Start Heavy Metrics Monitor (1.5s) - PROCESSES & NETWORK (Removed slow FS Size)
    heavyIntervalId = setInterval(async () => {
        try {
            // A. Network Stats
            let network = [];
            try { network = await si.networkStats(); } catch (e) { console.error("Net err", e); }

            // B. Filesystem Size (Use Cached)
            // Emit diskNetwork event for Dashboard widget
            const diskIO = await si.disksIO().catch(() => ({}));
            io.emit('diskNetwork', {
                diskIO: diskIO || {},
                fsSize: cachedFsSize || [],
                network: network || []
            });

            // C. Process Tree
            try {
                const procs = await si.processes();
                io.emit('processTree', procs.list);
            } catch (e) { console.error("Proc err", e); }

        } catch (error) {
            console.error("Heavy monitoring loop error:", error);
        }
    }, 3000);

    // 2b. Slow Monitor (60s) - DISK SIZE
    const updateFsSize = async () => {
        try { cachedFsSize = await si.fsSize(); } catch (e) { console.error("FS err", e); }
    };
    slowIntervalId = setInterval(updateFsSize, 60000);
    updateFsSize(); // Initial call

    // 3. Start History Snapshot (Every 1 hour, and once immediately)
    const takeSnapshot = async () => {
        try {
            const fsStats = await si.fsSize();
            await historyService.addSnapshot(fsStats);
            console.log("History snapshot saved");
        } catch (err) {
            console.error("History snapshot failed", err);
        }
    };

    historyIntervalId = setInterval(takeSnapshot, 60 * 60 * 1000); // 1 hour
    takeSnapshot(); // Initial snapshot

    // 4. Start Event Log Monitor (Every 4s)
    logIntervalId = setInterval(async () => {
        if (process.platform !== 'win32') return;

        try {
            // Fetch recent logs
            const ps = `
             $ErrorActionPreference = 'SilentlyContinue'
             [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
             $logs = Get-EventLog -LogName Application -Newest 5
             if ($logs) {
                 $logs | Select-Object @{N='Time';E={$_.TimeGenerated.ToString('o')}},@{N='Id';E={$_.EventID}},@{N='LevelDisplayName';E={$_.EntryType}},Message,@{N='ProviderName';E={$_.Source}},@{N='RecordId';E={$_.Index}} | ConvertTo-Json -Compress
             }
             `;
            const encoded = Buffer.from(ps, 'utf16le').toString('base64');
            const { stdout } = await execAsync(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`);

            if (!stdout || !stdout.trim()) {
                // console.log("Empty logs");
                return;
            }

            let logs = [];
            try {
                logs = JSON.parse(stdout);
            } catch (e) { console.error("JSON err:", e); return; }

            if (!Array.isArray(logs)) logs = [logs];

            // Filter duplicates
            const newLogs = logs.filter(l => {
                const key = `${l.ProviderName}-${l.RecordId}`;
                if (seenLogKeys.has(key)) return false;
                seenLogKeys.add(key);
                return true;
            });

            if (seenLogKeys.size > 2000) {
                // Clear old keys to prevent memory leak
                seenLogKeys = new Set([...seenLogKeys].slice(-1000));
            }

            if (newLogs.length > 0) {
                io.emit('events', newLogs);
            }

        } catch (e) {
            // Ignore (e.g. no new events or ps error)
        }
    }, 4000);
};

exports.stopMonitoring = () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    if (historyIntervalId) {
        clearInterval(historyIntervalId);
        historyIntervalId = null;
    }
    if (heavyIntervalId) {
        clearInterval(heavyIntervalId);
        heavyIntervalId = null;
    }
    if (logIntervalId) {
        clearInterval(logIntervalId);
        logIntervalId = null;
    }
    if (slowIntervalId) {
        clearInterval(slowIntervalId);
        slowIntervalId = null;
    }
};
