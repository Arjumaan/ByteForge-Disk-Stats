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

// Build path - handle both development and Electron packaging
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');

console.log('Looking for client build at:', clientBuildPath);

if (fs.existsSync(clientBuildPath)) {
    console.log("✅ Serving static from " + clientBuildPath);
    app.use(express.static(clientBuildPath));
} else {
    console.error("❌ Build not found at:", clientBuildPath);
    console.log("Current directory:", __dirname);
    console.log("Files in parent:", fs.readdirSync(path.join(__dirname, '..')));
}

// Handle SPA routing
app.get(/.*/, (req, res) => {
    const indexPath = path.join(clientBuildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send(`
            <html>
                <body style="background:#1a1a1a;color:#fff;font-family:Arial;padding:50px;text-align:center;">
                    <h1>❌ Frontend Not Found</h1>
                    <p>Build path: ${clientBuildPath}</p>
                    <p>Index path: ${indexPath}</p>
                    <p>Please rebuild the client: <code>cd client && npm run build</code></p>
                </body>
            </html>
        `);
    }
});

module.exports = app;
