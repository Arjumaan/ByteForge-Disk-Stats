const cleanupService = require('../services/cleanup.service');

exports.scan = async (req, res) => {
    try {
        const items = await cleanupService.scanJunk();
        res.json({ items });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.execute = async (req, res) => {
    try {
        const { items } = req.body;
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: "Invalid items array" });
        }
        const result = await cleanupService.executeCleanup(items);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
