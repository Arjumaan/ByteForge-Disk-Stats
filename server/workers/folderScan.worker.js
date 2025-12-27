const { parentPort, workerData } = require('worker_threads');
const fs = require('fs').promises;
const path = require('path');

const CATEGORIES = {
    'Images': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'],
    'Video': ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm'],
    'Audio': ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a'],
    'Archives': ['.zip', '.rar', '.7z', '.tar', '.gz', '.iso', '.dmg'],
    'Documents': ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.ppt', '.pptx', '.md'],
    'Code': ['.js', '.html', '.css', '.ts', '.tsx', '.jsx', '.json', '.java', '.py', '.c', '.cpp', '.php', '.sql'],
    'Executables': ['.exe', '.msi', '.bat', '.sh', '.app', '.dll']
};

function getFileCategory(filename) {
    const ext = path.extname(filename).toLowerCase();
    for (const [category, extensions] of Object.entries(CATEGORIES)) {
        if (extensions.includes(ext)) return category;
    }
    return 'Other';
}

async function scan(dirPath, depth = 0, context) {
    if (depth > context.maxDepth) return null;

    // Check for cancellation/interruption if needed (via messaging)

    const stats = {
        path: dirPath,
        name: path.basename(dirPath),
        size: 0,
        files: 0,
        folders: 0,
        categories: {},
        children: []
    };

    // Init categories
    Object.keys(CATEGORIES).forEach(cat => stats.categories[cat] = 0);
    stats.categories['Other'] = 0;

    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            // Skip protected/system paths if configured
            if (context.excludePaths && context.excludePaths.some(p => fullPath.includes(p))) {
                continue;
            }

            try {
                if (entry.isDirectory()) {
                    const childStats = await scan(fullPath, depth + 1, context);
                    if (childStats) {
                        stats.size += childStats.size;
                        stats.files += childStats.files;
                        stats.folders += 1 + childStats.folders;

                        // Only add large children to the tree to save memory/bandwidth
                        if (childStats.size > 10 * 1024 * 1024) { // Only > 10MB in tree
                            stats.children.push({
                                name: entry.name,
                                path: fullPath,
                                size: childStats.size,
                                value: childStats.size, // for charts
                                type: 'directory'
                            });
                        }

                        // Merge categories
                        for (const [cat, size] of Object.entries(childStats.categories)) {
                            stats.categories[cat] += size;
                        }
                    }
                } else {
                    const fileStats = await fs.stat(fullPath);
                    stats.size += fileStats.size;
                    stats.files += 1;

                    const category = getFileCategory(entry.name);
                    stats.categories[category] += fileStats.size;
                }
            } catch (err) {
                // Access denied or other fs error
            }
        }

        // Send progress update for top-level folders
        if (depth === 1) {
            parentPort.postMessage({ type: 'progress', data: { path: dirPath, size: stats.size } });
        }

        return stats;

    } catch (error) {
        return null; // Initial dir access failed
    }
}

// Listen for start command
parentPort.on('message', async (message) => {
    if (message.type === 'start') {
        const { path: scanPath, maxDepth = 5 } = message.data;
        try {
            // Expanded default excludes for Windows system stability
            const excludePaths = [
                '$Recycle.Bin', 'System Volume Information', 'Config.Msi',
                'Windows/System32/LogFiles', 'Recovery'
            ];

            const result = await scan(scanPath, 0, { maxDepth, excludePaths });

            if (!result) throw new Error("Scan returned no data (possibly access denied)");

            // Sort children by size descending for better visualization
            if (result.children) {
                result.children.sort((a, b) => b.size - a.size);
            }

            parentPort.postMessage({ type: 'complete', data: result });
        } catch (error) {
            parentPort.postMessage({ type: 'error', error: error.message });
        }
    }
});
