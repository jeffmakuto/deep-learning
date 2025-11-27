const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/database');
const { getDatabase } = require('./config/firebase');
require('dotenv').config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Initialize Firebase Realtime Database
const rtdb = getDatabase();

// Store active connections
const activeUsers = new Map();
const eventRooms = new Map();

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`✓ New client connected: ${socket.id}`);
  
  // User joins with authentication
  socket.on('user:join', (userData) => {
    activeUsers.set(socket.id, {
      userId: userData.userId,
      name: userData.name,
      role: userData.role,
      connectedAt: new Date()
    });
    
    console.log(`User ${userData.name} (${userData.userId}) joined`);
    
    // Emit active users count
    io.emit('users:count', activeUsers.size);
  });
  
  // Join event room for live updates
  socket.on('event:join', (eventId) => {
    socket.join(`event-${eventId}`);
    
    if (!eventRooms.has(eventId)) {
      eventRooms.set(eventId, new Set());
    }
    eventRooms.get(eventId).add(socket.id);
    
    console.log(`Socket ${socket.id} joined event room: ${eventId}`);
    
    // Send current room size
    io.to(`event-${eventId}`).emit('event:viewers', eventRooms.get(eventId).size);
  });
  
  // Leave event room
  socket.on('event:leave', (eventId) => {
    socket.leave(`event-${eventId}`);
    
    if (eventRooms.has(eventId)) {
      eventRooms.get(eventId).delete(socket.id);
      io.to(`event-${eventId}`).emit('event:viewers', eventRooms.get(eventId).size);
    }
    
    console.log(`Socket ${socket.id} left event room: ${eventId}`);
  });
  
  // Live event update
  socket.on('event:update', (data) => {
    const { eventId, update } = data;
    
    // Broadcast to all users in the event room
    io.to(`event-${eventId}`).emit('event:live-update', {
      eventId,
      update,
      timestamp: new Date()
    });
    
    // Store in Firebase for persistence
    if (rtdb) {
      rtdb.ref(`events/${eventId}/liveUpdates`).push({
        ...update,
        timestamp: Date.now()
      });
    }
    
    console.log(`Live update for event ${eventId}:`, update);
  });
  
  // Score update for sports events
  socket.on('event:score-update', (data) => {
    const { eventId, score } = data;
    
    io.to(`event-${eventId}`).emit('event:score-change', {
      eventId,
      score,
      timestamp: new Date()
    });
    
    if (rtdb) {
      rtdb.ref(`events/${eventId}/score`).set(score);
    }
    
    console.log(`Score update for event ${eventId}:`, score);
  });
  
  // RSVP update
  socket.on('event:rsvp', (data) => {
    const { eventId, userId, status } = data;
    
    io.to(`event-${eventId}`).emit('event:rsvp-update', {
      eventId,
      userId,
      status,
      timestamp: new Date()
    });
    
    console.log(`RSVP update - Event: ${eventId}, User: ${userId}, Status: ${status}`);
  });
  
  // Typing indicator for comments/chat
  socket.on('event:typing', (data) => {
    const { eventId, userName, isTyping } = data;
    socket.to(`event-${eventId}`).emit('event:user-typing', {
      userName,
      isTyping
    });
  });
  
  // Send notification to specific users
  socket.on('notification:send', (data) => {
    const { userIds, notification } = data;
    
    // Find sockets for specified users
    for (const [socketId, userData] of activeUsers.entries()) {
      if (userIds.includes(userData.userId)) {
        io.to(socketId).emit('notification:receive', notification);
      }
    }
  });
  
  // Broadcast notification to all users
  socket.on('notification:broadcast', (notification) => {
    io.emit('notification:receive', notification);
  });
  
  // Calendar sync request
  socket.on('calendar:sync', (userId) => {
    // This would trigger calendar synchronization
    socket.emit('calendar:synced', {
      userId,
      timestamp: new Date(),
      success: true
    });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    const userData = activeUsers.get(socket.id);
    
    if (userData) {
      console.log(`User ${userData.name} disconnected`);
    }
    
    activeUsers.delete(socket.id);
    
    // Remove from all event rooms
    for (const [eventId, sockets] of eventRooms.entries()) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        io.to(`event-${eventId}`).emit('event:viewers', sockets.size);
      }
    }
    
    io.emit('users:count', activeUsers.size);
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.set('io', io);
app.set('rtdb', rtdb);

// Import routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const notificationRoutes = require('./routes/notifications');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    activeConnections: activeUsers.size,
    activeEventRooms: eventRooms.size,
    database: 'connected',
    firebase: rtdb ? 'connected' : 'not configured'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 Event Management Server Running`);
  console.log(`${'='.repeat(50)}`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`👥 Active Users: ${activeUsers.size}`);
  console.log(`${'='.repeat(50)}\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
