const monitorService = require('../services/monitor.service');

exports.start = (req, res) => {
    const io = req.app.get('io');
    monitorService.startMonitoring(io);
    res.json({ message: "Monitoring started" });
};

exports.stop = (req, res) => {
    monitorService.stopMonitoring();
    res.json({ message: "Monitoring stopped" });
};

exports.getStats = async (req, res) => {
    // Provide a single snapshot
    // Used for initial load if websocket isn't ready
    res.json({ message: "Use WebSocket 'system:stats' for real-time data" });
};
