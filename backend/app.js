const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS - allow your frontend on any localhost port
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    // Allow localhost on any port
    if (origin.startsWith('http://localhost:')) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Washly Backend API',
    version: '4.1.1',
    endpoints: {
      health: '/api/health',
      users: '/api/users',
      machines: '/api/machines',
      bookings: '/api/bookings',
      chat: '/api/chat',
      sensors: '/api/sensors',
      ai: '/api/ai',
      notify: '/api/notify',
      admin: '/api/admin'          // added admin endpoints
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const usersRouter = require('./routes/users');
const machinesRouter = require('./routes/machines');
const bookingsRouter = require('./routes/bookings');
const chatRouter = require('./routes/chat');
const sensorsRouter = require('./routes/sensors');
const aiRouter = require('./routes/ai');
const notifyRouter = require('./routes/notify');
const adminRouter = require('./routes/admin');   // <-- add this

app.use('/api/users', usersRouter);   
app.use('/api/machines', machinesRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/sensors', sensorsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/notify', notifyRouter);
app.use('/api/admin', adminRouter);   // <-- add this

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