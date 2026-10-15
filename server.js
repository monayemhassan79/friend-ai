import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

const MODELS_TO_TRY = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash'
];

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });
  
  for (const modelName of MODELS_TO_TRY) {
    try {
      console.log(`Trying: ${modelName}`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: message }] }],
        config: {
          systemInstruction: "You are Friend AI, made by Monayem. Friendly Bengali friend."
        }
      });
      const text = response.text;
      if (text) {
        return res.json({ reply: text });
      }
    } catch (e) {
      console.log(`${modelName} failed: ${e.message}`);
      continue;
    }
  }
  res.json({ reply: 'একটু বেশি চাপ পড়েছে! 😅 আবার Try করো!' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Running on ' + PORT));