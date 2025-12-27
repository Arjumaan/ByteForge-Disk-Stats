const si = require('systeminformation');
const fs = require('fs').promises;
const path = require('path');

exports.getDiskOverview = async (req, res) => {
    try {
        // fsSize returns array of mounted file systems
        // diskLayout returns physical disk devices
        const [fsSize, diskLayout, osInfo] = await Promise.all([
            si.fsSize(),
            si.diskLayout(),
            si.osInfo()
        ]);

        res.json({
            fsSize,
            diskLayout,
            osInfo: {
                platform: osInfo.platform,
                distro: osInfo.distro,
                release: osInfo.release,
                hostname: osInfo.hostname
            }
        });
    } catch (error) {
        console.error("Error getting disk overview:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.scanDirectory = async (req, res) => {
    // TODO: Implement recursive scanning
    // This needs to be carefully managed to not block the event loop
    // best served via WebSocket related messages/background job
    res.json({ message: "Scan endpoint ready for implementation" });
};

exports.cleanupItems = async (req, res) => {
    res.json({ message: "Cleanup endpoint ready for implementation" });
};
