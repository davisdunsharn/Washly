const { supabase } = require('../config/supabase');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// POST /api/ai/recommend-machine - Get AI recommendation for best machine
const recommendMachine = async (req, res) => {
  try {
    // Accept both GET query params and POST body
    const clothing_type = req.body?.clothing_type || req.query?.clothing_type;
    const preferred_time = req.body?.preferred_time || req.query?.preferred_time;

    if (!clothing_type) {
      return res.status(400).json({ 
        error: 'Missing required parameter: clothing_type',
        example: 'POST /api/ai/recommend with body: { "clothing_type": "cotton", "preferred_time": "morning" }' 
      });
    }

    // Get available machines
    const { data: machines, error: machinesError } = await supabase
      .from('machines')
      .select('*')
      .eq('status', 'available');

    if (machinesError) throw machinesError;

    if (!machines || machines.length === 0) {
      return res.json({
        recommendation: 'No machines available at the moment',
        machines: []
      });
    }

    // Build AI prompt
    const machineList = machines
      .map(m => `Machine ${m.machine_id}: ${m.machine_name} (Location: ${m.location}, Capacity: ${m.capacity}L)`)
      .join('\n');

    const prompt = `You are a laundry expert. Based on the following available machines and the user's needs, recommend the BEST machine and explain why.

Available Machines:
${machineList}

User Request:
- Clothing Type: ${clothing_type}
- Preferred Time: ${preferred_time || 'any time'}

Provide a brief, friendly recommendation (max 2 sentences). Include the machine name/location.`;

    // Call Groq AI
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'mixtral-8x7b-32768',
      max_tokens: 300
    });

    const recommendation = response.choices[0]?.message?.content || 'Unable to generate recommendation';

    res.json({
      recommendation,
      available_machines: machines.length,
      machines: machines.map(m => ({
        id: m.machine_id,
        name: m.machine_name,
        location: m.location,
        capacity: m.capacity
      }))
    });
  } catch (err) {
    console.error('Recommend machine error:', err);
    res.status(500).json({ error: 'Failed to generate recommendation' });
  }
};

// GET/POST /api/ai/tips - Get AI laundry care tips
const getLaundryTips = async (req, res) => {
  try {
    // Accept both GET query params and POST body
    const fabric_type = req.body?.fabric_type || req.query?.fabric_type;
    const stain_type = req.body?.stain_type || req.query?.stain_type;

    const prompt = `Provide practical laundry care tips for:
- Fabric: ${fabric_type || 'general clothing'}
- Stain: ${stain_type || 'general cleaning'}

Keep it brief and actionable (max 150 words).`;

    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'mixtral-8x7b-32768',
      max_tokens: 250
    });

    const tips = response.choices[0]?.message?.content || 'Unable to generate tips';

    res.json({ tips });
  } catch (err) {
    console.error('Get laundry tips error:', err);
    res.status(500).json({ error: 'Failed to generate laundry tips' });
  }
};

module.exports = {
  recommendMachine,
  getLaundryTips
};
