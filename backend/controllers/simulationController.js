const { supabase } = require('../config/supabase');
const { sendCompletionNotification, sendAvailabilityNotification } = require('../services/emailService');

// Track machines that currently have a running simulation so a booking can't be
// "started" twice and spin up two competing timers writing to the same machine.
const runningSimulations = new Set();

// How long a simulated cycle takes end-to-end, in seconds.
// Real machines run 30–60 min, but for a live demo we compress the cycle so the
// full Washing → Rinsing → Spinning → Drying → Complete flow finishes on stage.
// Override with DEMO_CYCLE_SECONDS in .env (e.g. set to 2700 for a true 45 min run).
const DEMO_CYCLE_SECONDS = parseInt(process.env.DEMO_CYCLE_SECONDS, 10) || 120;

// Start a machine by booking_id
const startMachine = async (req, res) => {
  try {
    const { booking_id } = req.body;
    if (!booking_id) return res.status(400).json({ error: 'booking_id required' });

    // Fetch booking with machine details
    const { data: booking, error: fetchErr } = await supabase
      .from('bookings')
      .select(`*, machines:machine_id(*)`)
      .eq('booking_id', booking_id)
      .single();
    if (fetchErr || !booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'pending') return res.status(400).json({ error: 'Booking is not pending' });
    if (booking.machines.status !== 'available') return res.status(409).json({ error: 'Machine not available' });

    // Guard: never run two simulations for the same machine at once
    if (runningSimulations.has(booking.machine_id)) {
      return res.status(409).json({ error: 'This machine already has a cycle running' });
    }
    runningSimulations.add(booking.machine_id);

    // Update booking to active and machine to in_use
    await supabase.from('bookings').update({ status: 'active' }).eq('booking_id', booking_id);
    await supabase.from('machines').update({ status: 'in_use' }).eq('machine_id', booking.machine_id);

    // Drive the cycle from 0 → 100% over DEMO_CYCLE_SECONDS
    const intervalMs = 3000; // emit a sensor reading every 3 seconds
    const increment = (intervalMs / (DEMO_CYCLE_SECONDS * 1000)) * 100;
    let progress = 0;

    const finish = async () => {
      runningSimulations.delete(booking.machine_id);
      clearInterval(timer);

      // Final sensor reading: cycle complete, machine idle
      await supabase.from('sensor_data').insert({
        machine_id: booking.machine_id,
        temperature: 22,
        water_level: 0,
        running_status: false,
        cycle_progress_pct: 100,
        recorded_at: new Date().toISOString()
      });

      // Free the machine and mark the booking complete
      await supabase.from('machines').update({ status: 'available' }).eq('machine_id', booking.machine_id);
      await supabase.from('bookings')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('booking_id', booking_id);

      // Email the owner that their laundry is done (fire-and-forget)
      const { data: user } = await supabase.from('users').select('email').eq('user_id', booking.user_id).single();
      if (user?.email) {
        sendCompletionNotification(user.email, booking.machine_id, booking.machines.machine_name)
          .catch(err => console.error('Failed to send completion email:', err));
      }

      // Let up to 5 users waiting on this machine know it's free again
      const { data: pendingBookings } = await supabase
        .from('bookings')
        .select('users(email)')
        .eq('machine_id', booking.machine_id)
        .eq('status', 'pending')
        .limit(5);

      pendingBookings?.forEach(pb => {
        if (pb.users?.email) {
          sendAvailabilityNotification(pb.users.email, booking.machines.machine_name)
            .catch(err => console.error('Failed to send availability email:', err));
        }
      });
    };

    const timer = setInterval(async () => {
      try {
        progress += increment;
        if (progress >= 100) {
          await finish();
          return;
        }
        // Emit a live sensor reading. Temperature ramps with the wash, water
        // level tracks roughly with progress — realistic enough for the dashboard.
        await supabase.from('sensor_data').insert({
          machine_id: booking.machine_id,
          temperature: Math.round((35 + Math.random() * 5) * 10) / 10,
          water_level: Math.min(100, Math.round(progress + 10)),
          running_status: true,
          cycle_progress_pct: Math.round(progress),
          recorded_at: new Date().toISOString()
        });
      } catch (err) {
        // Don't let a transient DB error leave a dangling timer
        console.error('Simulation tick error:', err.message);
        runningSimulations.delete(booking.machine_id);
        clearInterval(timer);
      }
    }, intervalMs);

    // Respond immediately — the frontend polls /sensors + Realtime for updates
    res.json({ message: 'Machine started', booking_id, cycle_seconds: DEMO_CYCLE_SECONDS });
  } catch (err) {
    console.error('Start machine error:', err);
    res.status(500).json({ error: 'Failed to start machine' });
  }
};

module.exports = { startMachine };
