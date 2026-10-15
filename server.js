import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY missing');
}
const ai = new GoogleGenAI({ apiKey: apiKey });

const MODELS_TO_TRY = [
  'gemini-2.5-flash-lite',
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-pro-latest',
  'gemini-2.5-pro'
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });
  
  let lastError = null;
  for (const modelName of MODELS_TO_TRY) {
    try {
      console.log(`Trying model: ${modelName}`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: message }] }],
        config: {
          systemInstruction: "You are Friend AI, made by Monayem. You are a friendly, helpful Bengali friend. Reply in same language user uses, mostly Bengali."
        }
      });
      const text = response.text;
      if (text) {
        console.log(`Success with ${modelName}`);
        return res.json({ reply: text });
      }
    } catch (e) {
      console.log(`${modelName} failed: ${e.message}`);
      lastError = e;
      await sleep(1000);
      continue;
    }
  }
  
  console.error('All models failed', lastError?.message);
  res.json({ reply: 'একটু বেশি চাপ পড়েছে! 😅 10 সেকেন্ড পর আবার Message দাও, আমি রেডি!\n\n(Debug: ' + (lastError?.message?.substring(0,100) || 'unknown') + ')' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Running on ' + PORT));