const si = require('systeminformation');

/**
 * GET /api/health/hardware
 * Returns detailed hardware specs and status
 */
async function getHardwareInfo(req, res) {
    try {
        const [
            system,
            cpu,
            memLayout,
            diskLayout,
            graphics,
            networkInterfaces
        ] = await Promise.all([
            si.system(),
            si.cpu(),
            si.memLayout(),
            si.diskLayout(),
            si.graphics(),
            si.networkInterfaces()
        ]);

        // Get current dynamic stats for health check
        let cpuTemp = await si.cpuTemperature();

        // Fallback for Windows CPU Temp if standard check fails
        if (!cpuTemp.main || cpuTemp.main === -1) {
            try {
                const { exec } = require('child_process');
                const util = require('util');
                const execAsync = util.promisify(exec);

                // Try WMI Thermal Zone
                const { stdout } = await execAsync('powershell -NoProfile -Command "Get-CimInstance MSAcpi_ThermalZoneTemperature -Namespace root/wmi | Select-Object -ExpandProperty CurrentTemperature"');
                const kelvinDeci = parseInt(stdout.trim());
                if (!isNaN(kelvinDeci)) {
                    // Convert deci-Kelvin to Celsius: (K*10 - 2732) / 10
                    cpuTemp.main = (kelvinDeci - 2732) / 10;
                }
            } catch (e) {
                // Ignore fallback error, likely permission issue
            }
        }

        // Enhance Disk info with SMART logic if possible (mocked or basic)
        const disks = diskLayout.map(d => ({
            ...d,
            status: d.smartStatus || "OK", // si might return 'Ok', 'Predicted', 'Bad' etc
        }));

        res.json({
            system,
            cpu: { ...cpu, temp: cpuTemp.main },
            memory: memLayout,
            disks,
            graphics: graphics.controllers,
            network: networkInterfaces
        });
    } catch (e) {
        console.error("Hardware Info Error:", e);
        res.status(500).json({ error: e.message });
    }
}

/**
 * GET /api/health/software
 * Returns OS info, security status, etc.
 */
async function getSoftwareInfo(req, res) {
    try {
        const [
            osInfo,
            uuid,
            shell,
            versions
        ] = await Promise.all([
            si.osInfo(),
            si.uuid(),
            si.shell(),
            si.versions()
        ]);

        // Processes summary
        const processes = await si.processes();

        res.json({
            os: osInfo,
            security: {
                uuid: uuid.os,
                serial: uuid.hardware
            },
            env: {
                shell,
                versions
            },
            status: {
                processes: processes.all,
                running: processes.running,
                blocked: processes.blocked,
                sleeping: processes.sleeping
            }
        });
    } catch (e) {
        console.error("Software Info Error:", e);
        res.status(500).json({ error: e.message });
    }
}

module.exports = {
    getHardwareInfo,
    getSoftwareInfo
};
