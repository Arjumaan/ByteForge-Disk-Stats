const si = require('systeminformation');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// OS Specific Implementation map
const SYSTEM = {
    platform: process.platform,

    async getDiskInfo() {
        try {
            const [fsSize, diskLayout, blockDevices] = await Promise.all([
                si.fsSize(),
                si.diskLayout(),
                si.blockDevices()
            ]);

            // Combine and normalize data
            return fsSize.map(fs => {
                const physicalDisk = diskLayout.find(d => d.device === fs.fs) || {};

                return {
                    mount: fs.mount,
                    type: fs.type,
                    size: fs.size,
                    used: fs.used,
                    available: fs.available,
                    usePercent: fs.use,
                    label: fs.fs, // Often the volume label on Windows
                    health: physicalDisk.smartStatus || 'Unknown', // Basic mapping
                    isSystem: this.isSystemDrive(fs.mount)
                };
            });
        } catch (error) {
            console.error("System Info Error:", error);
            throw error;
        }
    },

    isSystemDrive(mountPoint) {
        if (this.platform === 'win32') {
            return mountPoint.toLowerCase().includes('c:');
        }
        return mountPoint === '/';
    }
};

module.exports = SYSTEM;
