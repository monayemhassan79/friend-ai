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
    // FIX 1: messages array এবং message দুটোই সাপোর্ট করবে
    let userText = '';
    let historyForGemini = [];

    if (req.body.messages && Array.isArray(req.body.messages)) {
      // Frontend থেকে history আসলে
      userText = req.body.messages[req.body.messages.length - 1]?.content || '';
      historyForGemini = req.body.messages.map(m => ({
        role: m.role === 'assistant'? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
    } else {
      // পুরানো message সাপোর্ট
      userText = req.body.message || '';
      historyForGemini = [{
        parts: [{ text: `You are a friendly AI assistant named Friend AI, created by Monayem. Reply in the same language user uses (Bengali/English mix allowed). Be helpful and friendly. User says: ${userText}` }]
      }];
    }

    if (!userText) {
      return res.json({ reply: 'বলো, কি help লাগবে?' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log("ERROR: GEMINI_API_KEY missing!");
      return res.json({ reply: 'Server এ API Key পাওয়া যায়নি' });
    }

    // FIX 2: Stable model gemini-1.5-flash ব্যবহার করা হলো
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: historyForGemini
      })
    });

    const data = await response.json();

    if (!data.candidates ||!data.candidates[0]) {
        console.log("Gemini Error Full:", JSON.stringify(data));
        return res.json({ reply: `AI Error: ${data.error?.message || 'Try again'}` });
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