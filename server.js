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
    let userText = req.body.messages?.[req.body.messages.length - 1]?.content || req.body.message || '';
    let historyForGemini = [];

    if (req.body.messages && Array.isArray(req.body.messages)) {
      historyForGemini = req.body.messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
    } else {
      historyForGemini = [{ parts: [{ text: userText }] }];
    }

    if (!userText) return res.json({ reply: 'বলো, কি help লাগবে?' });

    const apiKey = process.env.GEMINI_API_KEY;
    
    // সব Latest Model Try করবে, একটা না চললে আরেকটা
    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-flash-latest',
      'gemini-1.5-flash-latest'
    ];

    let lastError = null;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying model: ${modelName}`);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: historyForGemini,
            systemInstruction: { parts: [{ text: "You are Friend AI, made by Monayem. Friendly, helpful, reply in user's language (Bengali/English mix)." }] }
          })
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0]) {
          return res.json({ reply: data.candidates[0].content.parts[0].text });
        }
        lastError = data.error?.message;
        console.log(`${modelName} failed:`, lastError);
      } catch (e) {
        lastError = e.message;
      }
    }
    
    return res.json({ reply: `AI Error: ${lastError}` });

  } catch (error) {
    res.json({ reply: 'AI is busy, একটু পর try করো!' });
  }
});

app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Friend AI running on port ${PORT}`));