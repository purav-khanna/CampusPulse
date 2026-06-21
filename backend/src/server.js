import 'dotenv/config';

console.log(
  "Gemini key loaded:",
  process.env.GEMINI_API_KEY
    ? process.env.GEMINI_API_KEY.substring(0,8) + "..."
    : "NOT FOUND"
);

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';
import { initializeDb, readDb } from './database/db.js';
import { initSocket } from './services/socketService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests
const corsOrigin = process.env.FRONTEND_URL;
if (!corsOrigin) {
  console.warn('WARNING: FRONTEND_URL environment variable is not defined!');
}
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  const oldJson = res.json;
  res.json = function(data) {
    console.log(`[RESPONSE] ${req.method} ${req.url} -> Status ${res.statusCode}`);
    return oldJson.call(this, data);
  };
  next();
});

// Ensure uploads folder exists and serve it statically
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Initialize persistent database
await initializeDb();

// Log number of admin users on startup
const db = readDb();
const adminCount = db.users.filter(u => u.role === 'admin').length;
console.log(`[STARTUP] Number of admin users found: ${adminCount}`);

// Register API Router
app.use('/api', apiRouter);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date() });
});

// Wrapper for Socket.IO HTTP server
const server = http.createServer(app);
initSocket(server, corsOrigin);

server.listen(PORT, () => {
  console.log(`CampusPulse backend server running on port ${PORT}`);
});
