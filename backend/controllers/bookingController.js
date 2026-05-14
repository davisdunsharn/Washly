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
      // normal user: only their own bookings
      const { data: userRecord } = await supabase
        .from('users')
        .select('user_id')
        .eq('clerk_id', userId)
        .single();
      
      if (!userRecord) return res.status(404).json({ error: 'User not found in DB' });
      query = query.eq('user_id', userRecord.user_id);
    }
    // admin gets all bookings

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
    const { machine_id, scheduled_start, duration_minutes } = req.body;
    const clerkId = req.user.clerkId;

    // validation
    if (!machine_id || !scheduled_start || !duration_minutes) {
      return res.status(400).json({ error: 'Missing required fields: machine_id, scheduled_start, duration_minutes' });
    }

    if (duration_minutes < 15 || duration_minutes > 180) {
      return res.status(400).json({ error: 'Duration must be between 15 and 180 minutes' });
    }

    // get user's internal id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id')
      .eq('clerk_id', clerkId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found. Did you sync?' });
    }

    // check machine exists and is available
    const { data: machine, error: machineError } = await supabase
      .from('machines')
      .select('status')
      .eq('machine_id', machine_id)
      .single();

    if (machineError || !machine) {
      return res.status(404).json({ error: 'Machine not found' });
    }

    if (machine.status !== 'available') {
      return res.status(409).json({ error: `Machine is ${machine.status}, cannot book` });
    }

    // check for overlapping bookings at same time slot
    const startTime = new Date(scheduled_start);
    const endTime = new Date(startTime.getTime() + duration_minutes * 60000);

    const { data: overlap, error: overlapError } = await supabase
      .from('bookings')
      .select('booking_id')
      .eq('machine_id', machine_id)
      .eq('status', 'pending') // only active/pending bookings block
      .lt('scheduled_start', endTime.toISOString())
      .gt('scheduled_start', startTime.toISOString())
      .limit(1);

    if (overlapError) throw overlapError;
    if (overlap && overlap.length > 0) {
      return res.status(409).json({ error: 'Machine already booked for that time slot' });
    }

    // create booking
    const { data: newBooking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.user_id,
        machine_id,
        scheduled_start: startTime.toISOString(),
        duration_minutes,
        status: 'pending'
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

// PUT /api/bookings/:id - update (reschedule) a booking
const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduled_start, duration_minutes } = req.body;
    const clerkId = req.user.clerkId;
    const userRole = req.user.role;

    // get the booking first
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*, users!inner(clerk_id)')
      .eq('booking_id', id)
      .single();

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // check permission: admin or owner
    const isOwner = booking.users?.clerk_id === clerkId;
    if (!isOwner && userRole !== 'admin') {
      return res.status(403).json({ error: 'You can only edit your own bookings' });
    }

    // if booking is already active/completed/cancelled, don't allow changes
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: `Cannot update booking with status '${booking.status}'` });
    }

    // prepare updates
    const updates = {};
    if (scheduled_start) updates.scheduled_start = new Date(scheduled_start).toISOString();
    if (duration_minutes) {
      if (duration_minutes < 15 || duration_minutes > 180) {
        return res.status(400).json({ error: 'Duration must be between 15 and 180 minutes' });
      }
      updates.duration_minutes = duration_minutes;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // optional: check for overlap if time changed
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

      if (overlap && overlap.length > 0) {
        return res.status(409).json({ error: 'New time conflicts with existing booking' });
      }
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

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const isOwner = booking.users?.clerk_id === clerkId;
    if (!isOwner && userRole !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own bookings' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ error: `Cannot cancel a booking that is ${booking.status}` });
    }

    // soft delete or hard delete? We'll hard delete for simplicity, but could set status='cancelled'
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