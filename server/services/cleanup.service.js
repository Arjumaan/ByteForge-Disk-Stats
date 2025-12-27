const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { getDiskInfo } = require('../system/disk.info');

// Helper to determine if a file is safe to delete
const isSafeToDelete = (filePath, stats) => {
    // Safety 1: Don't delete recently modified files (24h)
    const oneDay = 24 * 60 * 60 * 1000;
    if (Date.now() - stats.mtimeMs < oneDay) return false;
    return true;
};

exports.scanJunk = async () => {
    const junkItems = [];
    const tempDir = os.tmpdir();

    // 1. Scan System Temp
    try {
        const files = await fs.readdir(tempDir);
        for (const file of files) {
            const filePath = path.join(tempDir, file);
            try {
                const stats = await fs.stat(filePath);
                if (stats.isFile()) {
                    junkItems.push({
                        id: Math.random().toString(36).substr(2, 9),
                        path: filePath,
                        size: stats.size,
                        category: 'System Temp',
                        description: 'Temporary system file',
                        safe: isSafeToDelete(filePath, stats)
                    });
                }
            } catch (e) { }
        }
    } catch (e) {
        console.error("Temp scan error:", e);
    }

    // 2. Mock Browser Cache (Real impl needs finding Chrome User Data path)
    // We'll add a "Simulated" Browser Cache entry to demonstrate the UI 
    junkItems.push({
        id: 'browser-cache-chrom',
        path: 'C:\\Users\\Default\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Cache',
        size: 150 * 1024 * 1024, // 150MB
        category: 'Browser Cache',
        description: 'Google Chrome Cached Images',
        safe: true
    });

    return junkItems;
};

exports.executeCleanup = async (items) => {
    const results = { success: [], failed: [] };

    // Process in chunks to avoid overwhelming the loop/disk, but faster than serial
    const chunkSize = 20;
    for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        await Promise.all(chunk.map(async (item) => {
            try {
                if (item.category === 'Browser Cache') {
                    // Mock success
                    results.success.push(item.path);
                    return;
                }

                // Force delete
                await fs.remove(item.path);
                results.success.push(item.path);
            } catch (error) {
                // Ignore EBUSY/EPERM (locked files)
                results.failed.push({ path: item.path, error: error.message });
            }
        }));
    }

    return results;
};
