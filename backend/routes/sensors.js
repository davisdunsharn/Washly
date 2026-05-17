const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const {
  getSensorData,
  recordSensorData,
  getLatestSensorReading
} = require('../controllers/sensorController');

// GET /api/sensors - Get all latest sensor readings
router.get('/', async (req, res) => {
  try {
    const { data: latestReadings, error } = await supabase
      .from('sensor_data')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    res.json({ sensor_data: latestReadings, count: latestReadings.length });
  } catch (err) {
    console.error('Get all sensor data error:', err);
    res.status(500).json({ error: 'Failed to fetch sensor data' });
  }
});

// POST /api/sensors - Record new sensor data
router.post('/', recordSensorData);

// GET /api/sensors/:machineId - Get sensor data for a machine
router.get('/:machineId', getSensorData);

// GET /api/sensors/:machineId/latest - Get latest reading
router.get('/:machineId/latest', getLatestSensorReading);

module.exports = router;
