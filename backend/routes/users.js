const express = require('express');
const router = express.Router();
const { clerkAuth } = require('../middleware/clerkAuth');
const { syncUser } = require('../controllers/userController');

// POST /api/users/sync - sync Clerk user to database
router.post('/sync', clerkAuth, syncUser);

module.exports = router;