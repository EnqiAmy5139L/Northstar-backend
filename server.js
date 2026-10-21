require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// 1. Block unauthorized websites from stealing your backend API
app.use(cors({
    origin: 'https://northstar-cleargate.vercel.app', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// 2. Protect your Free Tier Gemini Quota
const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minute window
    max: 5, // Limit each IP to 5 evaluations per 15 minutes
    message: { error: "To ensure fair usage, evaluations are limited to 5 per 15 minutes. Please try again shortly." }
});

// 3. Apply the limiter ONLY to the AI evaluation route
app.use('/api/evaluate', aiLimiter);
const PORT = process.env.PORT || 8080;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_PROMPT = 30000;

if (!process.env.GEMINI_API_KEY) console.warn("GEMINI_API_KEY is not set - /api/evaluate will fail.");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || true }));
app.use(express.json({ limit: "1mb" }));

// Health check (also useful to wake a sleeping Render instance)
app.get(["/", "/health"], (_req, res) => res.json({ ok: true, service: "northstar-cleargate-backend" }));

app.post("/api/evaluate", async (req, res) => {
  const prompt = req.body && req.body.prompt;
  if (typeof prompt !== "string" || !prompt.trim()) return res.status(400).json({ error: "No prompt provided." });
  if (prompt.length > MAX_PROMPT) return res.status(413).json({ error: "Prompt too long." });
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(prompt);
    res.json({ aiResponse: result.response.text() });
  } catch (err) {
    console.error("Gemini AI Error:", err);
    res.status(500).json({ error: "Failed to process AI evaluation." });
  }
});

app.listen(PORT, () => console.log(`NorthStar backend listening on :${PORT} (model: ${MODEL})`));
