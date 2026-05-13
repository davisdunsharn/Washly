// config/groq.js — Groq AI client initialization
const Groq = require('groq-sdk');

const groqApiKey = process.env.GROQ_API_KEY;

if (!groqApiKey) {
  throw new Error('Missing Groq API key in .env');
}

const groq = new Groq({ apiKey: groqApiKey });

module.exports = { groq };
