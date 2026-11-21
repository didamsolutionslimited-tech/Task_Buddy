import express from 'express';
import path from 'path';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import pool from './config/db';
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import bookingRoutes from './routes/bookingRoutes';
import kycRoutes from './routes/kycRoutes';
import socialRoutes from './routes/socialRoutes';
import applyRoutes from './routes/applyRoutes';
import chatRoutes from './routes/chatRoutes';
import reviewRoutes from './routes/reviewRoutes';
import tierRoutes from './routes/tierRoutes';
import webAuthRoutes from './routes/webAuthRoutes';
import { setupChatServer } from './ws';
import { authOptional } from './middleware/auth';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// uploaded documents (admin review)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// identity resolution for routes that may use it (tasks: post/list/helping)
app.use('/api/tasks', authOptional);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/apply', applyRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/tiers', tierRoutes);
app.use('/api/web-auth', webAuthRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Task Buddy API is running' });
});

// Database connectivity test
app.get('/db-test', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ status: 'connected', time: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// WebSocket chat + call signaling
setupChatServer(server);

server.listen(PORT, () => {
  console.log(`🚀 Task Buddy Server running on port ${PORT} (HTTP + WebSocket)`);
});
