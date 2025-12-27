const path = require('path');
const { Worker } = require('worker_threads');
const systemDisk = require('../system/disk.info');

// Store active workers
const activeScans = new Map();

exports.getOverview = async (req, res) => {
    try {
        const diskData = await systemDisk.getDiskInfo();
        res.json({ disks: diskData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.startScan = (req, res) => {
    let { path: scanPath } = req.body;
    const io = req.app.get('io');

    if (!scanPath) {
        return res.status(400).json({ error: "Path is required" });
    }

    // Fix Windows drive letter path (e.g. "D:" -> "D:\")
    if (process.platform === 'win32' && /^[a-zA-Z]:$/.test(scanPath)) {
        scanPath += '\\';
    }

    if (activeScans.has(scanPath)) {
        return res.json({ message: "Scan already in progress" });
    }

    const worker = new Worker(path.join(__dirname, '../workers/folderScan.worker.js'));
    activeScans.set(scanPath, worker);

    worker.postMessage({ type: 'start', data: { path: scanPath } });

    worker.on('message', (msg) => {
        if (msg.type === 'progress') {
            io.emit('scan:progress', msg.data);
        } else if (msg.type === 'complete') {
            io.emit('scan:complete', msg.data);
            activeScans.delete(scanPath);
            worker.terminate();
        } else if (msg.type === 'error') {
            io.emit('scan:error', msg.error);
            activeScans.delete(scanPath);
            worker.terminate();
        }
    });

    worker.on('error', (err) => {
        console.error("Worker error:", err);
        io.emit('scan:error', err.message);
        activeScans.delete(scanPath);
    });

    worker.on('exit', (code) => {
        if (code !== 0) {
            console.error(new Error(`Worker stopped with exit code ${code}`));
            activeScans.delete(scanPath);
        }
    });

    res.json({ message: "Scan started", path: scanPath });
};
