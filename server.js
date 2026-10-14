require('dotenv').config();
const express = require('express');
const OpenAI = require('openai');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const completion = await openai.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        { role: "system", content: "You are Friend AI, created by Md. Monayem Mia. You are a best friend, helpful, friendly, funny. Answer in Bangla mixed English like a real friend." },
    ...messages
      ],
    });
    res.json({ reply: completion.choices[0].message.content });
  } catch (e) {
    console.log(e);
    res.json({ reply: "Error: " + e.message });
  }
});

app.get('/', (req,res)=> res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(3000, ()=> console.log("Friend AI running at http://localhost:3000"));