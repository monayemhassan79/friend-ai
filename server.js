const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
  try {
    let userText = '';
    let historyForGemini = [];

    if (req.body.messages && Array.isArray(req.body.messages)) {
      userText = req.body.messages[req.body.messages.length - 1]?.content || '';
      historyForGemini = req.body.messages.map(m => ({
        role: m.role === 'assistant'? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
    } else {
      userText = req.body.message || '';
      historyForGemini = [{
        parts: [{ text: userText }]
      }];
    }

    if (!userText) {
      return res.json({ reply: 'বলো, কি help লাগবে?' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({ reply: 'Server এ API Key পাওয়া যায়নি' });
    }

    // FIXED MODEL - এটাই আসল Fix
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: historyForGemini,
        systemInstruction: {
          parts: [{ text: "You are Friend AI, created by Monayem. You are friendly, helpful. Reply in the same language user uses (Bengali/English mix allowed)." }]
        }
      })
    });

    const data = await response.json();

    if (!data.candidates ||!data.candidates[0]) {
      console.log("Gemini Error:", JSON.stringify(data));
      return res.json({ reply: `AI Error: ${data.error?.message || 'Try again later'}` });
    }

    const reply = data.candidates[0].content.parts[0].text;
    res.json({ reply });

  } catch (error) {
    console.error("Server Error:", error);
    res.json({ reply: 'AI is busy, একটু পর try করো!' });
  }
});

app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Friend AI running on port ${PORT}`);
});