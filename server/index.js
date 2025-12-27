const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const diskRoutes = require('./routes/diskRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite default port
    methods: ["GET", "POST", "DELETE"]
  }
});

// Make io accessible in routes
app.set('io', io);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/disk', diskRoutes);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
