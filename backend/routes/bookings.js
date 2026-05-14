const express = require('express');
const router = express.Router();
const { clerkAuth } = require('../middleware/clerkAuth');
const {
  getUserBookings,
  createBooking,
  updateBooking,
  deleteBooking
} = require('../controllers/bookingController');

// all booking routes require authentication
router.use(clerkAuth);

router.get('/', getUserBookings);
router.post('/', createBooking);
router.put('/:id', updateBooking);
router.delete('/:id', deleteBooking);

module.exports = router;