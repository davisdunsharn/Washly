const express = require('express');
const router = express.Router();
const { clerkAuth } = require('../middleware/clerkAuth');
const {
  recommendMachine,
  getLaundryTips
} = require('../controllers/aiController');

// GET /api/ai - API info
router.get('/', (req, res) => {
  res.json({
    message: 'Washly AI API',
    endpoints: {
      'GET /api/ai/recommend?clothing_type=cotton': 'Get AI recommendation (query params)',
      'POST /api/ai/recommend': 'Get AI recommendation (JSON body)',
      'GET /api/ai/tips?fabric_type=silk': 'Get laundry tips (query params)',
      'POST /api/ai/tips': 'Get laundry tips (JSON body)'
    },
    note: 'All endpoints require Bearer token authentication'
  });
});

// GET /api/ai/recommend - Get recommendation with query params
router.get('/recommend', clerkAuth, recommendMachine);

// POST /api/ai/recommend - Get recommendation with JSON body
router.post('/recommend', clerkAuth, recommendMachine);

// GET /api/ai/tips - Get tips with query params
router.get('/tips', clerkAuth, getLaundryTips);

// POST /api/ai/tips - Get tips with JSON body
router.post('/tips', clerkAuth, getLaundryTips);

module.exports = router;
