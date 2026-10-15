require('dotenv').config();
const express = require('express');
const OpenAI = require('openai');
const cors = require('cors');
const path = require('path');

const app = express();

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ===== GROQ / OPENAI SETUP =====
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

// ===== CHAT API =====
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    const completion = await openai.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'system',
          content:
            'You are Friend AI, created by Md. Monayem Mia. You are a best friend, helpful, friendly, and talk like a real friend.',
        },
       ...messages,
      ],
    });

    res.json({
      reply: completion.choices[0].message.content,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ reply: 'Sorry, something went wrong!' });
  }
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});