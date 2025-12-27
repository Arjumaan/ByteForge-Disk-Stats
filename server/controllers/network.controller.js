const si = require('systeminformation');

/**
 * GET /api/network/details
 * Returns comprehensive network information:
 * - Active Interfaces (IP, MAC, Type)
 * - WiFi Details (SSID, Signal, Security) if applicable
 * - Gateway & DNS
 * - Current Stats (Throughput)
 */
async function getNetworkDetails(req, res) {
    try {
        // Run in parallel for speed
        const [interfaces, wifi, gateway, stats] = await Promise.all([
            si.networkInterfaces(),
            si.wifiConnections().catch(() => []), // Fallback if no WiFi
            si.networkGatewayDefault(),
            si.networkStats()
        ]);

        // Merge stats into interfaces if possible, or just send separate
        // Filter mainly for active non-internal interfaces
        const activeInterfaces = interfaces.filter(iface => !iface.internal && iface.operstate === 'up');

        // Detailed WiFi info (find matching interface)
        const wifiDetails = wifi.length > 0 ? wifi[0] : null;

        res.json({
            interfaces: activeInterfaces,
            wifi: wifiDetails,
            gateway,
            stats: stats,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error("Network details error:", error);
        res.status(500).json({ error: error.message });
    }
}

const https = require('https');

// ... (existing imports/code)

async function runSpeedTest(req, res) {
    // 10MB test file from Cloudflare
    const url = 'https://speed.cloudflare.com/__down?bytes=10000000';
    const start = Date.now();
    let bytes = 0;

    const request = https.get(url, (response) => {
        if (response.statusCode !== 200) {
            return res.status(500).json({ error: `Speed test failed with status ${response.statusCode}` });
        }

        response.on('data', (chunk) => {
            bytes += chunk.length;
        });

        response.on('end', () => {
            const duration = (Date.now() - start) / 1000; // seconds
            const bps = (bytes * 8) / duration;
            const mbps = bps / 1000000;

            res.json({
                downloadSpeed: Number(mbps.toFixed(2)),
                bytes: bytes,
                duration: duration
            });
        });
    });

    request.on('error', (err) => {
        res.status(500).json({ error: err.message });
    });

    // Timeout after 15s to prevent hanging
    request.setTimeout(15000, () => {
        request.destroy();
        // Response might have already been sent if 'error' triggers, but handled by error listener usually
    });
}

module.exports = {
    getNetworkDetails,
    runSpeedTest
};
