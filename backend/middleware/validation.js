// middleware/validation.js — Input validation helper
const validateBookingInput = (req, res, next) => {
  const { machine_id, scheduled_start, duration_minutes } = req.body;

  if (!machine_id) {
    return res.status(422).json({ error: 'machine_id is required' });
  }

  if (!scheduled_start) {
    return res.status(422).json({ error: 'scheduled_start is required' });
  }

  if (!duration_minutes || duration_minutes < 15 || duration_minutes > 180) {
    return res.status(422).json({ error: 'duration_minutes must be between 15 and 180' });
  }

  try {
    new Date(scheduled_start);
  } catch {
    return res.status(422).json({ error: 'scheduled_start must be a valid ISO date' });
  }

  next();
};

module.exports = { validateBookingInput };
