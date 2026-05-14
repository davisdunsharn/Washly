require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  module.exports = { supabase: null };
} else {
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase client initialized');
  module.exports = { supabase };
}