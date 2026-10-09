// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB with fallback
function connectDB() {
  const primaryURI = process.env.MONGODB_URI;
  const fallbackURI = 'mongodb://localhost:27017/taskdb';
  const tryConnect = uri =>
    mongoose.connect(uri)
      .then(() => console.log('MongoDB connected to', uri))
      .catch(err => {
        console.error('MongoDB connection error with', uri, ':', err.message);
        return Promise.reject(err);
      });

  if (primaryURI) {
    return tryConnect(primaryURI).catch(() => {
      console.log('Falling back to local MongoDB');
      return tryConnect(fallbackURI);
    });
  } else {
    return tryConnect(fallbackURI);
  }
}

connectDB();

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Serve frontend static files from the sibling "frontend" folder
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const PORT = process.env.PORT || 5006;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`Port ${PORT} in use, trying fallback port 5007`);
    const fallbackPort = 5007;
    const fallbackServer = app.listen(fallbackPort, () => console.log(`Server running on fallback port ${fallbackPort}`));
    fallbackServer.on('error', e => {
      console.error('Failed to start server on fallback port:', e);
      process.exit(1);
    });
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});
