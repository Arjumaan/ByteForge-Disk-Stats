
const { Worker } = require('worker_threads');
const path = require('path');

exports.findDuplicates = (req, res) => {
    const { path: scanPath } = req.body;

    if (!scanPath) return res.status(400).json({ error: "Path required" });

    const worker = new Worker(path.join(__dirname, '../workers/hashScan.worker.js'));

    worker.postMessage({ type: 'start', path: scanPath });

    worker.on('message', (msg) => {
        if (msg.type === 'complete') {
            res.json(msg.results);
            worker.terminate();
        } else if (msg.type === 'error') {
            res.status(500).json({ error: msg.error });
            worker.terminate();
        }
        // Could stream progress via SSE/Socket but for now just wait
    });

    worker.on('error', (err) => {
        res.status(500).json({ error: err.message });
        worker.terminate();
    });
};
