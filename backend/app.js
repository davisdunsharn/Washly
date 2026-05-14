// app.js — Express server entry point
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// routes
const usersRouter = require('./routes/users');
const machinesRouter = require('./routes/machines');
const bookingsRouter = require('./routes/bookings');

app.use('/api/users', usersRouter);
app.use('/api/machines', machinesRouter);
app.use('/api/bookings', bookingsRouter);

// error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Something broke' : err.message
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Washly backend running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});