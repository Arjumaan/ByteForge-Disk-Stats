const appManager = require('../services/appManager.service');

exports.listApps = async (req, res) => {
    try {
        const apps = await appManager.getInstalledApps();
        res.json({ apps });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.uninstallApp = async (req, res) => {
    try {
        const { uninstallString } = req.body;
        // In a real app, requires Admin privileges validation here
        await appManager.uninstallApp(uninstallString);
        res.json({ message: "Uninstaller started" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getIcon = async (req, res) => {
    try {
        const { path } = req.query;
        if (!path) return res.status(400).send("Path required");

        const base64 = await appManager.getAppIcon(path);
        if (!base64) return res.status(404).send("Icon not found");

        const img = Buffer.from(base64, 'base64');
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': img.length,
            'Cache-Control': 'public, max-age=86400' // Cache for 1 day
        });
        res.end(img);
    } catch (e) {
        res.status(500).send("Error fetching icon");
    }
};
