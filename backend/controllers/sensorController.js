const { supabase } = require('../config/supabase');

// GET /api/sensors/:machineId - Get sensor data for a machine
const getSensorData = async (req, res) => {
  try {
    const { machineId } = req.params;
    const { limit = 50 } = req.query;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(machineId)) {
      return res.status(400).json({ error: 'Invalid machine ID format' });
    }

    // Get recent sensor data
    const { data: sensorData, error } = await supabase
      .from('sensor_data')
      .select('*')
      .eq('machine_id', machineId)
      .order('recorded_at', { ascending: false })
      .limit(Math.min(parseInt(limit), 100));

    if (error) throw error;

    res.json({ sensor_data: sensorData, count: sensorData.length });
  } catch (err) {
    console.error('Get sensor data error:', err);
    res.status(500).json({ error: 'Failed to fetch sensor data' });
  }
};

// POST /api/sensors - Record new sensor data (from IoT device)
const recordSensorData = async (req, res) => {
  try {
    const { machine_id, temperature, humidity, water_level, status } = req.body;

    // Validate required fields
    if (!machine_id) {
      return res.status(400).json({ error: 'Missing required field: machine_id' });
    }

    // Validate machine exists
    const { data: machine, error: machineError } = await supabase
      .from('machines')
      .select('machine_id')
      .eq('machine_id', machine_id)
      .single();

    if (machineError || !machine) {
      return res.status(404).json({ error: 'Machine not found' });
    }

    // Insert sensor reading
    const { data: sensorReading, error: insertError } = await supabase
      .from('sensor_data')
      .insert({
        machine_id,
        temperature: temperature || null,
        humidity: humidity || null,
        water_level: water_level || null,
        status: status || 'normal',
        recorded_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) throw insertError;

    res.status(201).json({ sensor_reading: sensorReading });
  } catch (err) {
    console.error('Record sensor data error:', err);
    res.status(500).json({ error: 'Failed to record sensor data' });
  }
};

// GET /api/sensors/:machineId/latest - Get latest sensor reading for a machine
const getLatestSensorReading = async (req, res) => {
  try {
    const { machineId } = req.params;

    const { data: latest, error } = await supabase
      .from('sensor_data')
      .select('*')
      .eq('machine_id', machineId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

    if (!latest) {
      return res.status(404).json({ error: 'No sensor data found for this machine' });
    }

    res.json({ latest_reading: latest });
  } catch (err) {
    console.error('Get latest sensor reading error:', err);
    res.status(500).json({ error: 'Failed to fetch latest sensor reading' });
  }
};

module.exports = {
  getSensorData,
  recordSensorData,
  getLatestSensorReading
};
