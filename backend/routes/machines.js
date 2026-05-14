
const express = require('express');
const router = express.Router();
const { clerkAuth } = require('../middleware/clerkAuth');
const {
  getAllMachines,
  getMachineById,
  updateMachineStatus
} = require('../controllers/machineController');

// Public routes (no auth needed to view machines)
router.get('/', getAllMachines);
router.get('/:id', getMachineById);

// Protected route - admin only
router.patch('/:id/status', clerkAuth, updateMachineStatus);

module.exports = router;