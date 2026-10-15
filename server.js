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
    let history = req.body.messages || [];

    if (!userText) return res.json({ reply: 'বলো, কি help লাগবে?' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.json({ reply: 'API Key Missing!' });

    const contents = history.map(m => ({
      role: m.role === 'assistant'? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    if (contents.length === 0) {
      contents.push({ parts: [{ text: userText }] });
    }

    // 2026 Working Model - v1beta must
    const model = 'gemini-2.0-flash';

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: { parts: [{ text: "You are Friend AI, made by Monayem. Be friendly, helpful. Reply in user's language." }] }
      })
    });

    const data = await response.json();
    console.log("Gemini Response:", JSON.stringify(data).substring(0, 500));

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return res.json({ reply: data.candidates[0].content.parts[0].text });
    } else {
      console.log("Full Error:", data);
      return res.json({ reply: `AI Error: ${data.error?.message || 'Model busy, try again'}` });
    }

  } catch (error) {
    console.error(error);
    res.json({ reply: 'Server busy, একটু পর try করো!' });
  }
});

app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Running on ${PORT}`));