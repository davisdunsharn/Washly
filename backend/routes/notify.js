const express = require('express');
const router = express.Router();
const { clerkAuth } = require('../middleware/clerkAuth');
const { supabase } = require('../config/supabase');

// GET /api/notify - Get notifications for current user
router.get('/', clerkAuth, async (req, res) => {
  try {
    const { clerkId } = req.user;

    // Get user record
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id')
      .eq('clerk_id', clerkId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get notifications (could be from a notifications table, or derived from bookings)
    // For now, we'll return upcoming bookings as notifications
    const { data: upcomingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        booking_id,
        scheduled_start,
        duration_minutes,
        machines(machine_name, location)
      `)
      .eq('user_id', user.user_id)
      .eq('status', 'pending')
      .order('scheduled_start', { ascending: true })
      .limit(10);

    if (bookingsError) throw bookingsError;

    const notifications = upcomingBookings.map(booking => ({
      id: booking.booking_id,
      type: 'booking_reminder',
      message: `Upcoming booking: ${booking.machines?.machine_name} at ${booking.machines?.location}`,
      scheduled_start: booking.scheduled_start,
      duration_minutes: booking.duration_minutes
    }));

    res.json({ notifications, count: notifications.length });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// POST /api/notify/send - Send a notification (admin only)
router.post('/send', clerkAuth, async (req, res) => {
  try {
    const { userId, message, type } = req.body;
    const { role } = req.user;

    // Admin check
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (!userId || !message) {
      return res.status(400).json({ error: 'Missing required fields: userId, message' });
    }

    // For now, just log the notification. In production, this would:
    // - Store in a notifications table
    // - Send email/SMS via SendGrid/Twilio
    // - Push notification to frontend
    console.log(`📢 Notification for user ${userId}: ${message} (type: ${type})`);

    res.json({
      success: true,
      message: 'Notification queued for sending',
      notification: { userId, message, type }
    });
  } catch (err) {
    console.error('Send notification error:', err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

module.exports = router;
