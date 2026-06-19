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

// POST /api/sensors - Record new sensor data (from IoT device / Cisco Packet Tracer)
// Stores the same fields the live simulation and frontend use so a real sensor
// reading is indistinguishable from a simulated one.
const recordSensorData = async (req, res) => {
  try {
    const {
      machine_id,
      temperature,
      water_level,
      running_status,
      cycle_progress_pct
    } = req.body;

    // Validate required fields
    if (!machine_id) {
      return res.status(400).json({ error: 'Missing required field: machine_id' });
    }

    // Validate UUID format early so a bad ID doesn't hit the DB
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(machine_id)) {
      return res.status(400).json({ error: 'Invalid machine ID format' });
    }

    // Validate machine exists
    const { data: machine, error: machineError } = await supabase
      .from('machines')
      .select('machine_id')
      .eq('machine_id', machine_id)
      .maybeSingle();

    if (machineError) throw machineError;
    if (!machine) {
      return res.status(404).json({ error: 'Machine not found' });
    }

    // Clamp progress into a sane 0–100 range if provided
    let progress = null;
    if (cycle_progress_pct !== undefined && cycle_progress_pct !== null) {
      progress = Math.max(0, Math.min(100, Math.round(Number(cycle_progress_pct))));
    }

    // Insert sensor reading
    const { data: sensorReading, error: insertError } = await supabase
      .from('sensor_data')
      .insert({
        machine_id,
        temperature: temperature ?? null,
        water_level: water_level ?? null,
        running_status: running_status ?? null,
        cycle_progress_pct: progress,
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
