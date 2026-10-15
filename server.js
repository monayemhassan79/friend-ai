import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static("public"));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Auto Retry Function
async function getAIResponse(prompt, imageBase64) {
  const models = ["gemini-1.5-flash-latest", "gemini-1.5-flash-8b", "gemini-1.5-flash"];
  for (let modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      let result;
      if (imageBase64) {
        const base64Data = imageBase64.split(',')[1];
        result = await model.generateContent([
          prompt,
          { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
        ]);
      } else {
        result = await model.generateContent(prompt);
      }
      return result.response.text();
    } catch (err) {
      console.log(`${modelName} failed: ${err.message}, trying next...`);
      continue; // পরের মডেল ট্রাই করো
    }
  }
  throw new Error("All models busy");
}

app.post("/api/chat", async (req, res) => {
  try {
    const { message, image } = req.body;
    if (!message &&!image) return res.json({ reply: "মেসেজ দাও ভাই!" });

    const systemPrompt = `তুমি Friend AI, Made by Monayem। তোমাকে Monayem তৈরি করেছে। তুমি বন্ধুসুলভ, বাংলায় উত্তর দাও। User prompt: ${message}`;

    const reply = await getAIResponse(systemPrompt, image);
    res.json({ reply });
  } catch (error) {
    console.error(error);
    // ইউজারকে সুন্দর বাংলায় Error দেখাবে, ইংরেজি High Demand না
    res.json({ reply: "একটু বেশি চাপ পড়েছে! 😅 10 সেকেন্ড পর আবার Message দাও, আমি রেডি!" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));