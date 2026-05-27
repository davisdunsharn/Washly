const { supabase } = require('../config/supabase');

// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const { count: totalMachines } = await supabase
      .from('machines')
      .select('*', { count: 'exact', head: true });
    const { count: activeBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'active']);
    const { count: inUse } = await supabase
      .from('machines')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_use');

    const total = totalMachines || 0;
    const utilisation = total ? Math.round((inUse / total) * 100) : 0;

    // Average wait time from pending bookings (duration in minutes)
    const { data: pending } = await supabase
      .from('bookings')
      .select('duration_minutes')
      .eq('status', 'pending');
    let avgWaitTime = 0;
    if (pending?.length) {
      const sum = pending.reduce((a, b) => a + b.duration_minutes, 0);
      avgWaitTime = Math.round(sum / pending.length);
    }

    res.json({ totalMachines: total, activeBookings: activeBookings || 0, utilisation, avgWaitTime });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// GET /api/admin/bookings
const getAllBookings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        booking_id,
        scheduled_start,
        duration_minutes,
        status,
        cycle_type,
        users:user_id (full_name, email),
        machines:machine_id (machine_name, location)
      `)
      .order('scheduled_start', { ascending: false });
    if (error) throw error;

    const bookings = data.map(b => ({
      id: b.booking_id,
      user: b.users?.full_name || b.users?.email,
      machine: b.machines?.machine_name,
      location: b.machines?.location,
      scheduled_start: b.scheduled_start,
      duration_minutes: b.duration_minutes,
      status: b.status,
      cycle_type: b.cycle_type
    }));
    res.json({ bookings });
  } catch (err) {
    console.error('Admin bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

// GET /api/admin/charts/bookings-per-hour
const getBookingsPerHour = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data, error } = await supabase
      .from('bookings')
      .select('scheduled_start')
      .gte('scheduled_start', sevenDaysAgo.toISOString());
    if (error) throw error;

    const hourCounts = Array(24).fill(0);
    data.forEach(b => {
      const hour = new Date(b.scheduled_start).getHours();
      hourCounts[hour]++;
    });
    const chartData = hourCounts.map((count, hour) => ({ hour: `${hour}:00`, count }));
    res.json({ chartData });
  } catch (err) {
    console.error('Chart error:', err);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
};

// POST /api/admin/machines
const createMachine = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { machine_name, location, floor, capacity_cycles, status } = req.body;
    if (!machine_name || !location || floor === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const { data, error } = await supabase
      .from('machines')
      .insert({
        machine_name,
        location,
        floor,
        capacity_cycles: capacity_cycles || 1,
        status: status || 'available'
      })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ machine: data });
  } catch (err) {
    console.error('Create machine error:', err);
    res.status(500).json({ error: 'Failed to create machine' });
  }
};

// PUT /api/admin/machines/:id
const updateMachine = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { id } = req.params;
    const updates = req.body;
    delete updates.machine_id;
    const { data, error } = await supabase
      .from('machines')
      .update({ ...updates, updated_at: new Date() })
      .eq('machine_id', id)
      .select()
      .single();
    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Machine not found' });
      throw error;
    }
    res.json({ machine: data });
  } catch (err) {
    console.error('Update machine error:', err);
    res.status(500).json({ error: 'Failed to update machine' });
  }
};

// DELETE /api/admin/machines/:id
const deleteMachine = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { id } = req.params;
    // Check for active bookings
    const { data: active, error: checkErr } = await supabase
      .from('bookings')
      .select('booking_id')
      .eq('machine_id', id)
      .in('status', ['pending', 'active'])
      .limit(1);
    if (checkErr) throw checkErr;
    if (active && active.length) {
      return res.status(409).json({ error: 'Cannot delete machine with active bookings' });
    }
    const { error } = await supabase.from('machines').delete().eq('machine_id', id);
    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Machine not found' });
      throw error;
    }
    res.json({ message: 'Machine deleted successfully' });
  } catch (err) {
    console.error('Delete machine error:', err);
    res.status(500).json({ error: 'Failed to delete machine' });
  }
};

module.exports = {
  getStats,
  getAllBookings,
  getBookingsPerHour,
  createMachine,
  updateMachine,
  deleteMachine
};