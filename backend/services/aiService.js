// services/aiService.js — Groq AI integration for wash time suggestions
const { groq } = require('../config/groq');

const getWashTimeSuggestion = async (bookings, currentSensorLoad) => {
  try {
    const prompt = `
You are a laundry optimization assistant. Based on the current bookings and machine sensor data, suggest the best time for a student to book a washing machine in the next 24 hours.

Current Bookings:
${JSON.stringify(bookings, null, 2)}

Current Machine Load (sensor data):
${JSON.stringify(currentSensorLoad, null, 2)}

Analyze the data and provide:
1. The optimal time to book (HH:MM format)
2. A brief reasoning (why this time is best)
3. Expected wait time reduction in percentage

Respond in JSON format only:
{
  "suggested_time": "HH:MM",
  "reasoning": "string",
  "expected_improvement": "percentage"
}
`;

    const message = await groq.messages.create({
      model: 'mixtral-8x7b-32768',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text;
    const suggestion = JSON.parse(responseText);

    return suggestion;
  } catch (err) {
    console.error('Groq AI error:', err.message);
    return {
      suggested_time: 'N/A',
      reasoning: 'Unable to generate suggestion at this time',
      expected_improvement: 'N/A'
    };
  }
};

module.exports = { getWashTimeSuggestion };
