const express = require('express');
const router = express.Router();
const { clerkAuth } = require('../middleware/clerkAuth');
const {
  getStats,
  getAllBookings,
  getBookingsPerHour,
  createMachine,
  updateMachine,
  deleteMachine
} = require('../controllers/adminController');

// All admin routes require authentication
router.use(clerkAuth);

// Stats & data
router.get('/stats', getStats);
router.get('/bookings', getAllBookings);
router.get('/charts/bookings-per-hour', getBookingsPerHour);

// Machine CRUD
router.post('/machines', createMachine);
router.put('/machines/:id', updateMachine);
router.delete('/machines/:id', deleteMachine);

module.exports = router;