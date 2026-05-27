const { supabase } = require('../config/supabase');

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

    // Update booking to active
    await supabase.from('bookings').update({ status: 'active' }).eq('booking_id', booking_id);
    // Update machine to in_use
    await supabase.from('machines').update({ status: 'in_use' }).eq('machine_id', booking.machine_id);

    // Determine cycle duration (minutes)
    const durationMap = { normal: 45, delicate: 60, heavy: 30 };
    const totalDuration = durationMap[booking.cycle_type] || 45;
    const intervalMs = 5000; // update every 5 seconds
    const increment = (intervalMs / (totalDuration * 60 * 1000)) * 100;
    let progress = 0;

    // Start simulation (in a real server, you'd use a job queue; for demo we'll use setInterval)
    const timer = setInterval(async () => {
      progress += increment;
      if (progress >= 100) {
        // Complete cycle
        await supabase.from('machines').update({ status: 'available' }).eq('machine_id', booking.machine_id);
        await supabase.from('bookings').update({ status: 'completed', completed_at: new Date() }).eq('booking_id', booking_id);
        clearInterval(timer);
        return;
      }
      // Insert sensor data
      await supabase.from('sensor_data').insert({
        machine_id: booking.machine_id,
        temperature: 35 + Math.random() * 5,
        water_level: Math.min(100, progress + 10),
        running_status: true,
        cycle_progress_pct: Math.round(progress),
        recorded_at: new Date()
      });
    }, intervalMs);

    // Send response immediately – frontend will use Realtime to see updates
    res.json({ message: 'Machine started', booking_id });
  } catch (err) {
    console.error('Start machine error:', err);
    res.status(500).json({ error: 'Failed to start machine' });
  }
};

module.exports = { startMachine };