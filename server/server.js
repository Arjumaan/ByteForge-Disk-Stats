const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // allow all for dev
        methods: ["GET", "POST"]
    }
});

// Attach IO to app for controllers to use
app.set('io', io);

const monitorService = require('./services/monitor.service');

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Start monitoring if not already started (or restart for new client logic if needed)
    // For now, simpler to just ensuring it's running. 
    // Ideally we track subscriber count but for this app global broadcast is fine.
    monitorService.startMonitoring(io);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Optional: Stop if 0 clients?
        if (io.engine.clientsCount === 0) {
            monitorService.stopMonitoring();
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`ByteForge Server running on port ${PORT}`);
    monitorService.startMonitoring(io);
});
