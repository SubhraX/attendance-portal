const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { WebSocketServer } = require('ws');
const crypto = require('crypto'); // <-- Added for token rotation
const connectDB = require('./config/db'); 
const authRoutes = require('./routes/auth'); 
const attendanceRoutes = require('./routes/attendance'); 

dotenv.config();
connectDB(); 

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Mount Routes
app.use('/api/auth', authRoutes); 
app.use('/api/attendance', attendanceRoutes); 

// Basic Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Server is running', ip: req.ip });
});

// WebSocket connection for real-time QR rotation
wss.on('connection', (ws) => {
  console.log('Client connected for real-time updates');
  
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    if (data.action === 'startRotation') {
      const classId = data.classId;
      
      const emitToken = () => {
        // Retrieve the active token created by the /start route
        const token = global.activeSessions?.[classId]?.currentToken;
        if (token) {
          ws.send(JSON.stringify({ type: 'NEW_QR_TOKEN', token }));
        }
      };

      emitToken(); // Send initial token

      // Rotate token every 30 seconds
      const interval = setInterval(() => {
        if (global.activeSessions && global.activeSessions[classId]) {
          const newToken = crypto.randomBytes(16).toString('hex');
          global.activeSessions[classId].currentToken = newToken;
          global.activeSessions[classId].expiresAt = Date.now() + 30 * 1000;
          emitToken();
        }
      }, 30000);

      // Clean up interval on disconnect
      ws.on('close', () => {
        console.log('Client disconnected, stopping rotation');
        clearInterval(interval);
      });
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});