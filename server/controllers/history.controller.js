const historyService = require('../services/history.service');

exports.getHistory = async (req, res) => {
    try {
        const data = await historyService.getHistory();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
