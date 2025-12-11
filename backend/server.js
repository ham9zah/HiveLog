require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIO = require('socket.io');
const cron = require('node-cron');

// Import routes
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const wikiRoutes = require('./routes/wiki');
const userRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload');
const notificationRoutes = require('./routes/notifications');

// Import services
const { checkAndTransitionPosts } = require('./services/transitionService');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible to routes
app.set('io', io);

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/wiki', wikiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'HiveLog backend is running' });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  // الانضمام لغرفة منشور
  socket.on('join-post', (postId) => {
    socket.join(`post-${postId}`);
    console.log(`User joined post room: post-${postId}`);
  });

  // مغادرة غرفة منشور
  socket.on('leave-post', (postId) => {
    socket.leave(`post-${postId}`);
  });

  // الانضمام لغرفة المستخدم (للإشعارات)
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User joined notification room: user-${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Cron job: Check for posts that need transition every hour
cron.schedule('0 * * * *', async () => {
  console.log('🔄 Running transition check...');
  try {
    await checkAndTransitionPosts(io);
  } catch (error) {
    console.error('Error in transition cron job:', error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
});

module.exports = { app, io };
