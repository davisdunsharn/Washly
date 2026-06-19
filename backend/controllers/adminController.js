const { supabase } = require('../config/supabase');

// Count machines, excluding soft-deleted rows when that column exists.
async function countMachines(extraFilter) {
  let q = supabase.from('machines').select('*', { count: 'exact', head: true }).eq('is_deleted', false);
  if (extraFilter) q = extraFilter(q);
  let { count, error } = await q;
  if (error && error.code === '42703') {
    let q2 = supabase.from('machines').select('*', { count: 'exact', head: true });
    if (extraFilter) q2 = extraFilter(q2);
    ({ count } = await q2);
  }
  return count || 0;
}

// True if another live machine already uses this name (case-insensitive).
// excludeId lets an edit keep its own name.
async function machineNameExists(name, excludeId) {
  const target = String(name).trim().toLowerCase();
  let { data, error } = await supabase
    .from('machines')
    .select('machine_id, machine_name')
    .eq('is_deleted', false);
  if (error && error.code === '42703') {
    ({ data } = await supabase.from('machines').select('machine_id, machine_name'));
  }
  return (data || []).some(m =>
    m.machine_id !== excludeId && (m.machine_name || '').trim().toLowerCase() === target
  );
}

// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const totalMachines = await countMachines();
    const inUse = await countMachines(q => q.eq('status', 'in_use'));
    const { count: activeBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'active']);

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
    if (!machine_name?.trim() || !location?.trim()) {
      return res.status(400).json({ error: 'Machine name and location are required' });
    }
    if (await machineNameExists(machine_name)) {
      return res.status(409).json({ error: `A machine named "${machine_name.trim()}" already exists` });
    }
    const validStatuses = ['available', 'in_use', 'maintenance', 'offline'];
    const { data, error } = await supabase
      .from('machines')
      .insert({
        machine_name: machine_name.trim(),
        location: location.trim(),
        floor: floor ?? '',
        capacity_cycles: Math.max(1, parseInt(capacity_cycles, 10) || 1),
        status: validStatuses.includes(status) ? status : 'available'
      })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ machine: data });
  } catch (err) {
    console.error('Create machine error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A machine with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create machine' });
  }
};

// PUT /api/admin/machines/:id
const updateMachine = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { id } = req.params;
    const body = req.body || {};

    // Only these fields may be edited via this endpoint (never is_deleted etc.)
    const updates = { updated_at: new Date().toISOString() };
    if (body.machine_name !== undefined) {
      const newName = String(body.machine_name).trim();
      if (await machineNameExists(newName, id)) {
        return res.status(409).json({ error: `A machine named "${newName}" already exists` });
      }
      updates.machine_name = newName;
    }
    if (body.location !== undefined)     updates.location = String(body.location).trim();
    if (body.floor !== undefined)        updates.floor = body.floor ?? '';
    if (body.capacity_cycles !== undefined) updates.capacity_cycles = Math.max(1, parseInt(body.capacity_cycles, 10) || 1);
    if (body.status !== undefined) {
      const validStatuses = ['available', 'in_use', 'maintenance', 'offline'];
      if (!validStatuses.includes(body.status)) {
        return res.status(400).json({ error: 'Invalid status', valid: validStatuses });
      }
      updates.status = body.status;
    }

    const { data, error } = await supabase
      .from('machines')
      .update(updates)
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
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A machine with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to update machine' });
  }
};

// DELETE /api/admin/machines/:id
// Soft delete: the machine is deactivated and flagged as deleted in the
// database, but the row (and all its booking/sensor history) is kept for
// reporting. It simply stops showing up in the app.
const deleteMachine = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { id } = req.params;

    // Can't deactivate a machine that's mid-cycle or has people queued on it
    const { data: active, error: checkErr } = await supabase
      .from('bookings')
      .select('booking_id')
      .eq('machine_id', id)
      .in('status', ['pending', 'active'])
      .limit(1);
    if (checkErr) throw checkErr;
    if (active && active.length) {
      return res.status(409).json({ error: 'Cannot deactivate a machine with active or pending bookings' });
    }

    // Flag the row as deleted rather than removing it
    const { data: updated, error } = await supabase
      .from('machines')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        status: 'offline',
        updated_at: new Date().toISOString()
      })
      .eq('machine_id', id)
      .select()
      .maybeSingle();

    // Fallback: if the soft-delete columns don't exist yet (migration not run),
    // fall back to a hard delete so the admin action still works.
    if (error && error.code === '42703') {
      const { error: delErr } = await supabase.from('machines').delete().eq('machine_id', id);
      if (delErr) throw delErr;
      return res.json({ message: 'Machine removed', soft: false });
    }
    if (error) throw error;
    if (!updated) return res.status(404).json({ error: 'Machine not found' });

    res.json({ message: 'Machine deactivated', soft: true, machine: updated });
  } catch (err) {
    console.error('Delete machine error:', err);
    res.status(500).json({ error: 'Failed to deactivate machine' });
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