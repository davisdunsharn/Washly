const { supabase } = require('../config/supabase');

// GET /api/bookings - get current user's bookings (or all if admin)
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.clerkId;
    const userRole = req.user.role;

    let query = supabase
      .from('bookings')
      .select(`
        *,
        machines:machine_id (machine_name, location, floor)
      `);

    if (userRole !== 'admin') {
      const { data: userRecord } = await supabase
        .from('users')
        .select('user_id')
        .eq('clerk_id', userId)
        .single();
      if (!userRecord) return res.status(404).json({ error: 'User not found in DB' });
      query = query.eq('user_id', userRecord.user_id);
    }

    const { data: bookings, error } = await query.order('scheduled_start', { ascending: false });
    if (error) throw error;
    res.json({ bookings });
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

// POST /api/bookings - create a new booking
const createBooking = async (req, res) => {
  try {
    const { machine_id, scheduled_start, duration_minutes, cycle_type } = req.body;
    const clerkId = req.user.clerkId;

    if (!machine_id || !scheduled_start || !duration_minutes) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (duration_minutes < 15 || duration_minutes > 180) {
      return res.status(400).json({ error: 'Duration must be between 15 and 180 minutes' });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id')
      .eq('clerk_id', clerkId)
      .single();
    if (userError || !user) {
      return res.status(404).json({ error: 'User not found. Did you sync?' });
    }

    // 3-booking limit
    const { count: activeCount, error: countError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.user_id)
      .in('status', ['pending', 'active']);
    if (countError) throw countError;
    if (activeCount >= 3) {
      return res.status(409).json({ error: 'You already have 3 active bookings. Please wait until one completes.' });
    }

    const { data: machine, error: machineError } = await supabase
      .from('machines')
      .select('status')
      .eq('machine_id', machine_id)
      .single();
    if (machineError || !machine) return res.status(404).json({ error: 'Machine not found' });
    if (machine.status !== 'available') {
      return res.status(409).json({ error: `Machine is ${machine.status}, cannot book` });
    }

    const startTime = new Date(scheduled_start);
    const endTime = new Date(startTime.getTime() + duration_minutes * 60000);
    const { data: overlap, error: overlapError } = await supabase
      .from('bookings')
      .select('booking_id')
      .eq('machine_id', machine_id)
      .eq('status', 'pending')
      .lt('scheduled_start', endTime.toISOString())
      .gt('scheduled_start', startTime.toISOString())
      .limit(1);
    if (overlapError) throw overlapError;
    if (overlap?.length) return res.status(409).json({ error: 'Machine already booked for that time slot' });

    const { data: newBooking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.user_id,
        machine_id,
        scheduled_start: startTime.toISOString(),
        duration_minutes,
        status: 'pending',
        cycle_type: cycle_type || 'normal'
      })
      .select()
      .single();
    if (insertError) throw insertError;

    res.status(201).json({ booking: newBooking });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

// PUT /api/bookings/:id - update booking
const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduled_start, duration_minutes } = req.body;
    const clerkId = req.user.clerkId;
    const userRole = req.user.role;

    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*, users!inner(clerk_id)')
      .eq('booking_id', id)
      .single();
    if (fetchError || !booking) return res.status(404).json({ error: 'Booking not found' });

    const isOwner = booking.users?.clerk_id === clerkId;
    if (!isOwner && userRole !== 'admin') {
      return res.status(403).json({ error: 'You can only edit your own bookings' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: `Cannot update booking with status '${booking.status}'` });
    }

    const updates = {};
    if (scheduled_start) updates.scheduled_start = new Date(scheduled_start).toISOString();
    if (duration_minutes) {
      if (duration_minutes < 15 || duration_minutes > 180) return res.status(400).json({ error: 'Invalid duration' });
      updates.duration_minutes = duration_minutes;
    }
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No valid fields to update' });

    if (updates.scheduled_start) {
      const newStart = new Date(updates.scheduled_start);
      const newEnd = new Date(newStart.getTime() + (updates.duration_minutes || booking.duration_minutes) * 60000);
      const { data: overlap } = await supabase
        .from('bookings')
        .select('booking_id')
        .eq('machine_id', booking.machine_id)
        .eq('status', 'pending')
        .neq('booking_id', id)
        .lt('scheduled_start', newEnd.toISOString())
        .gt('scheduled_start', newStart.toISOString())
        .limit(1);
      if (overlap?.length) return res.status(409).json({ error: 'New time conflicts with existing booking' });
    }

    const { data: updated, error: updateError } = await supabase
      .from('bookings')
      .update(updates)
      .eq('booking_id', id)
      .select()
      .single();
    if (updateError) throw updateError;
    res.json({ booking: updated });
  } catch (err) {
    console.error('Update booking error:', err);
    res.status(500).json({ error: 'Failed to update booking' });
  }
};

// DELETE /api/bookings/:id - cancel booking
const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const clerkId = req.user.clerkId;
    const userRole = req.user.role;

    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*, users!inner(clerk_id), status')
      .eq('booking_id', id)
      .single();
    if (fetchError || !booking) return res.status(404).json({ error: 'Booking not found' });

    const isOwner = booking.users?.clerk_id === clerkId;
    if (!isOwner && userRole !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own bookings' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: `Cannot cancel a booking that is ${booking.status}` });
    }

    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('booking_id', id);
    if (deleteError) throw deleteError;
    res.json({ message: 'Booking cancelled successfully' });
  } catch (err) {
    console.error('Delete booking error:', err);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
};

module.exports = {
  getUserBookings,
  createBooking,
  updateBooking,
  deleteBooking
};
