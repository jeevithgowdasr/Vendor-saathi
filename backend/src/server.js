import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

import { setupOrderSockets } from './sockets/orderSocket.js';
import { parseKannadaVoiceQuery } from './ai/voiceParser.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Attach Socket.IO to request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Connect Database
connectDB();

// Health Check API Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'VendorSaathi Backend REST API & Real-time Server',
    timestamp: new Date().toISOString()
  });
});

// Voice AI Query Parsing Endpoint
app.post('/api/ai/parse-voice', (req, res) => {
  const { query } = req.body;
  const parsed = parseKannadaVoiceQuery(query);
  res.status(200).json({ success: true, parsed });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/payments', paymentRoutes);

// Socket.IO Events
setupOrderSockets(io);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 VendorSaathi Backend Server running on http://localhost:${PORT}`);
  console.log(`⚡ Real-time Socket.IO active on ws://localhost:${PORT}`);
});
