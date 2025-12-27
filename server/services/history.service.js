const fs = require('fs-extra');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/history.json');

// Ensure DB exists
fs.ensureFileSync(DB_PATH);
try {
    const content = fs.readFileSync(DB_PATH, 'utf8');
    if (!content.trim()) fs.writeJsonSync(DB_PATH, { snapshots: [] });
} catch (e) {
    fs.writeJsonSync(DB_PATH, { snapshots: [] });
}

exports.addSnapshot = async (disks) => {
    try {
        const db = await fs.readJson(DB_PATH);

        const timestamp = Date.now();
        const snapshot = {
            timestamp,
            disks: disks.map(d => ({
                mount: d.mount,
                used: d.used,
                total: d.size,
                usePercent: d.usePercent
            }))
        };

        db.snapshots.push(snapshot);

        // Keep only last 30 days (assuming 1 snapshot/hour = 24 * 30 = 720 records)
        // actually let's just limit by count for safety (e.g. 1000)
        if (db.snapshots.length > 2000) {
            db.snapshots = db.snapshots.slice(db.snapshots.length - 2000);
        }

        await fs.writeJson(DB_PATH, db);
        return snapshot;
    } catch (error) {
        console.error("History save failed:", error);
    }
};

exports.getHistory = async () => {
    try {
        const db = await fs.readJson(DB_PATH);
        return db.snapshots;
    } catch (error) {
        return [];
    }
};
