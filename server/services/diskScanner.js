const { Worker } = require('worker_threads');
const path = require('path');

/**
 * Scans a directory using a worker thread to prevent blocking the main event loop.
 * @param {string} dirPath - Path to scan
 * @param {number} depth - Max depth (not fully used by worker start logic currently but passed)
 * @param {number} maxDepth - Max recursive depth
 */
function scanDirectory(dirPath, depth = 0, maxDepth = 5) {
    return new Promise((resolve, reject) => {
        const workerPath = path.join(__dirname, '../workers/folderScan.worker.js');
        const worker = new Worker(workerPath);

        worker.postMessage({
            type: 'start',
            data: {
                path: dirPath,
                maxDepth: maxDepth
            }
        });

        worker.on('message', (message) => {
            if (message.type === 'complete') {
                resolve(message.data);
                worker.terminate();
            } else if (message.type === 'error') {
                reject(new Error(message.error));
                worker.terminate();
            } else if (message.type === 'progress') {
                // Optional: Emit progress via socket if we had access to io here
                // console.log('Scan progress:', message.data);
            }
        });

        worker.on('error', (err) => {
            reject(err);
            worker.terminate();
        });

        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });
    });
}

module.exports = {
    scanDirectory
};
