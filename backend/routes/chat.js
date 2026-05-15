const express = require('express');
const router = express.Router();
const { clerkAuth } = require('../middleware/clerkAuth');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/', clerkAuth, async (req, res) => {
  try {
    const { message, systemPrompt, conversationHistory } = req.body;
    
    // Build messages array
    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    // Add conversation history (excluding system prompt)
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        if (msg.role !== 'system') {
          messages.push({ role: msg.role, content: msg.content });
        }
      });
    } else {
      // Fallback: just the current message
      messages.push({ role: 'user', content: message });
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: 'mixtral-8x7b-32768',
      max_tokens: 1024,
    });
    const reply = chatCompletion.choices[0]?.message?.content || 'Sorry, I could not respond.';
    res.json({ reply });
  } catch (err) {
    console.error('Groq error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;