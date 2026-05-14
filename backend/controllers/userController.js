const { supabase } = require('../config/supabase');

const syncUser = async (req, res) => {
  try {
    const { clerkId, email, fullName, role } = req.user;

    const { data: existing, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existing) {
      return res.json({ user: existing, synced: false });
    }

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        clerk_id: clerkId,
        email,
        full_name: fullName || email.split('@')[0],
        role: role || 'student'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    res.status(201).json({ user: newUser, synced: true });
  } catch (err) {
    console.error('User sync error:', err);
    res.status(500).json({ error: 'Failed to sync user' });
  }
};

module.exports = { syncUser };