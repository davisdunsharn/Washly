// controllers/machineController.js
const { supabase } = require('../config/supabase');

// GET /api/machines - Get all machines with latest status
const getAllMachines = async (req, res) => {
  try {
    const { data: machines, error } = await supabase
      .from('machines')
      .select('*')
      .order('machine_name', { ascending: true });

    if (error) throw error;

    res.json({ machines });
  } catch (err) {
    console.error('Get machines error:', err);
    res.status(500).json({ error: 'Failed to fetch machines' });
  }
};

// GET /api/machines/:id - Get single machine with latest sensor reading
const getMachineById = async (req, res) => {
  try {
    const { id } = req.params;

    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: 'Invalid machine ID format' });
    }

    // Get machine details
    const { data: machine, error: machineError } = await supabase
      .from('machines')
      .select('*')
      .eq('machine_id', id)
      .maybeSingle();

    if (machineError) throw machineError;
    if (!machine) return res.status(404).json({ error: 'Machine not found' });

    // Get latest sensor reading - using maybeSingle to avoid error when no data
    const { data: latestSensor, error: sensorError } = await supabase
      .from('sensor_data')
      .select('*')
      .eq('machine_id', id)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    res.json({ ...machine, latest_sensor: latestSensor || null });
  } catch (err) {
    console.error('Get machine by ID error:', err);
    res.status(500).json({ error: 'Failed to fetch machine' });
  }
};

// PATCH /api/machines/:id/status - Update machine status (admin only)
const updateMachineStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['available', 'in_use', 'maintenance', 'offline'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status', 
        valid: validStatuses 
      });
    }

    // Check if user is admin (role from Clerk JWT middleware)
    const userRole = req.user?.role;
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Update the machine
    const { data: updated, error } = await supabase
      .from('machines')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('machine_id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Machine not found' });
      }
      throw error;
    }

    res.json({ machine: updated });
  } catch (err) {
    console.error('Update machine status error:', err);
    res.status(500).json({ error: 'Failed to update machine status' });
  }
};

module.exports = {
  getAllMachines,
  getMachineById,
  updateMachineStatus
};