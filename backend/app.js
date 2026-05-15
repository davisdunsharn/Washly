const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS - allow your frontend on port 5175
app.use(cors({
  origin: 'http://localhost:5175',
  credentials: true
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const usersRouter = require('./routes/users');
const machinesRouter = require('./routes/machines');
const bookingsRouter = require('./routes/bookings');
const chatRouter = require('./routes/chat');   // <-- ADD THIS

app.use('/api/users', usersRouter);
app.use('/api/machines', machinesRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/chat', chatRouter);              // <-- ADD THIS

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