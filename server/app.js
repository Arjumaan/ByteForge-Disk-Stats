const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());

// Load routes
app.use('/api/disk', require('./routes/disk.routes'));
app.use('/api/cleanup', require('./routes/cleanup.routes'));
app.use('/api/apps', require('./routes/apps.routes'));
app.use('/api/monitor', require('./routes/monitor.routes'));
app.use('/api/reports', require('./routes/reports.routes'));
app.use('/api/history', require('./routes/history.routes'));
app.use('/api/duplicates', require('./routes/duplicates.routes'));
app.use('/api/events', require('./routes/events.routes'));
app.use('/api/registry', require('./routes/registry.routes'));
app.use('/api/system', require('./routes/taskmanager.routes'));
app.use('/api/network', require('./routes/network.routes'));
app.use('/api/health', require('./routes/health.routes'));

// Build path
const clientBuildPath = path.resolve(__dirname, '..', 'client', 'dist');

if (fs.existsSync(clientBuildPath)) {
    console.log("Serving static from " + clientBuildPath);
    app.use(express.static(clientBuildPath));
} else {
    console.warn("Build not found");
}

// Handle SPA routing
app.get(/.*/, (req, res) => {
    const indexPath = path.join(clientBuildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        // Serve a friendly waiting page instead of a hard error during builds
        res.type('html').send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>ByteForge - Updating</title>
                <meta http-equiv="refresh" content="2">
                <style>body{font-family:system-ui,sans-serif;display:flex;height:100vh;justify-content:center;align-items:center;background:#f8fafc;color:#334155}</style>
            </head>
            <body>
                <div style="text-align:center">
                    <h1 style="margin-bottom:10px">System Updating...</h1>
                    <p>The dashboard is rebuilding. Please wait...</p>
                    <div style="margin-top:20px;display:inline-block;width:20px;height:20px;border:3px solid #cbd5e1;border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite"></div>
                    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
                </div>
            </body>
            </html>
        `);
    }
});

module.exports = app;
