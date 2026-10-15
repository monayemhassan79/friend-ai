import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', async (req, res) => {
  try {
    let userText = req.body.messages?.[req.body.messages.length - 1]?.content || req.body.message || '';
    let history = req.body.messages || [];
    let imageBase64 = req.body.image || null;

    if (!userText &&!imageBase64) return res.json({ reply: 'বলো, কি help লাগবে? ছবি থাকলে + চাপো!' });

    const apiKey = process.env.GEMINI_API_KEY;
    const MODELS_TO_TRY = ['gemini-2.5-flash','gemini-2.5-flash-lite','gemini-3-flash-preview','gemini-flash-latest'];

    const contents = history.map(m => ({
      role: m.role === 'assistant'? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    let parts = [];
    if (userText) parts.push({ text: userText });
    if (imageBase64) {
      const base64Data = imageBase64.includes(',')? imageBase64.split(',')[1] : imageBase64;
      let mimeType = 'image/jpeg';
      if (imageBase64.includes(';')) {
        mimeType = imageBase64.split(';')[0].split(':')[1] || mimeType;
      }
      parts.push({ inline_data: { mime_type: mimeType, data: base64Data } });
    }

    if (contents.length === 0) contents.push({ role: 'user', parts });
    else contents[contents.length - 1].parts = parts;

    for (const model of MODELS_TO_TRY) {
      try {
        console.log(`Trying ${model}`);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: "You are Friend AI, made by Monayem. Be friendly, helpful. Reply in user's language, mostly Bengali." }] }
          })
        });
        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return res.json({ reply: data.candidates[0].content.parts[0].text });
        }
      } catch (e) {
        console.log(e.message);
      }
    }
    return res.json({ reply: 'একটু Busy আছি ভাই, 10 সেকেন্ড পর আবার বলো!' });
  } catch (e) {
    console.error(e);
    res.json({ reply: 'Server busy!' });
  }
});

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Running on ${PORT}`));