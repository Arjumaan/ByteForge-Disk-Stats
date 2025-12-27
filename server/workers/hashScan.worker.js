const { parentPort, workerData } = require('worker_threads');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

async function getPartialHash(filePath) {
    const fd = await fs.open(filePath, 'r');
    const buffer = Buffer.alloc(1024); // Read first 1KB
    try {
        await fs.read(fd, buffer, 0, 1024, 0);
        await fs.close(fd);
        return crypto.createHash('md5').update(buffer).digest('hex');
    } catch (e) {
        await fs.close(fd).catch(() => { });
        return null;
    }
}

async function getFullHash(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5');
        const stream = fs.createReadStream(filePath);
        stream.on('data', data => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}

async function findDuplicates(scanPath) {
    const sizeMap = new Map(); // size -> [filePaths]
    let filesScanned = 0;

    // 1. Gather files by size (NO depth limit - scan everything)
    async function traverse(dir) {
        try {
            const files = await fs.readdir(dir);
            for (const file of files) {
                // Only skip critical system folders
                if (['$Recycle.Bin', 'System Volume Information', 'Windows'].includes(file)) continue;

                const fullPath = path.join(dir, file);
                try {
                    const stats = await fs.stat(fullPath);
                    if (stats.isDirectory()) {
                        await traverse(fullPath); // Recursive - no depth limit
                    } else if (stats.size >= 1024 * 1024) { // Files >= 1MB
                        if (!sizeMap.has(stats.size)) sizeMap.set(stats.size, []);
                        sizeMap.get(stats.size).push(fullPath);
                        filesScanned++;

                        // Report progress every 500 files
                        if (filesScanned % 500 === 0) {
                            parentPort.postMessage({
                                type: 'status',
                                message: `Scanned ${filesScanned} files...`
                            });
                        }
                    }
                } catch (e) {
                    // Skip files we can't access
                }
            }
        } catch (e) {
            // Skip directories we can't access
        }
    }

    parentPort.postMessage({ type: 'status', message: 'Scanning entire disk for files >= 1MB...' });
    await traverse(scanPath);

    // 2. Filter potential duplicates (same size)
    const candidates = [...sizeMap.values()].filter(paths => paths.length > 1);
    const duplicates = [];
    let processed = 0;

    parentPort.postMessage({ type: 'status', message: `Analyzing ${candidates.length} candidate groups...` });

    for (const group of candidates) {
        const hashMap = new Map();

        for (const filePath of group) {
            try {
                // 3. Partial Hash Check
                const pHash = await getPartialHash(filePath);
                if (!pHash) continue;

                if (!hashMap.has(pHash)) hashMap.set(pHash, []);
                hashMap.get(pHash).push(filePath);
            } catch (e) { }
        }

        // 4. Full Hash Check for partial matches
        for (const [pHash, files] of hashMap) {
            if (files.length > 1) {
                const fullHashMap = new Map();
                for (const f of files) {
                    try {
                        const fullHash = await getFullHash(f);
                        if (!fullHashMap.has(fullHash)) fullHashMap.set(fullHash, []);
                        fullHashMap.get(fullHash).push(f);
                    } catch (e) { }
                }

                for (const [fHash, finalFiles] of fullHashMap) {
                    if (finalFiles.length > 1) {
                        duplicates.push({
                            hash: fHash,
                            size: fs.statSync(finalFiles[0]).size,
                            files: finalFiles
                        });
                    }
                }
            }
        }
        processed++;
        if (processed % 10 === 0) {
            parentPort.postMessage({ type: 'progress', percent: Math.round((processed / candidates.length) * 100) });
        }
    }

    return duplicates;
}

parentPort.on('message', async (msg) => {
    if (msg.type === 'start') {
        try {
            const results = await findDuplicates(msg.path);
            parentPort.postMessage({ type: 'complete', results });
        } catch (e) {
            parentPort.postMessage({ type: 'error', error: e.message });
        }
    }
});
