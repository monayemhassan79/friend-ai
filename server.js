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

async function getAIResponse(prompt, imageBase64) {
  const models = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-flash-latest"];

  for (let modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      let result;

      if (imageBase64) {
        const base64Data = imageBase64.includes(',')? imageBase64.split(',')[1] : imageBase64;
        result = await model.generateContent([
          prompt,
          { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
        ]);
      } else {
        result = await model.generateContent(prompt);
      }

      return result.response.text();
    } catch (err) {
      console.log(modelName + " busy, trying next...");
      continue;
    }
  }
  return null;
}

app.post("/api/chat", async (req, res) => {
  try {
    const { message, image } = req.body;

    if (!message &&!image) {
      return res.json({ reply: "মেসেজ দাও ভাই!" });
    }

    const systemPrompt = "তুমি Friend AI, তোমাকে Monayem বানিয়েছে। তুমি বন্ধুসুলভ ভাবে বাংলায় উত্তর দাও। ইউজারের প্রশ্ন: " + (message || "ছবিটা কি?");

    const reply = await getAIResponse(systemPrompt, image);

    if (!reply) {
      return res.json({ reply: "একটু বেশি চাপ পড়েছে! 😅 10 সেকেন্ড পর আবার Message দাও, আমি রেডি!" });
    }

    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.json({ reply: "একটু বেশি চাপ পড়েছে! 😅 10 সেকেন্ড পর আবার Message দাও, আমি রেডি!" });
  }
});

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "public" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server Live on " + PORT));