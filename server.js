require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 8080;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_PROMPT = 30000;
const ORIGINS = (process.env.ALLOWED_ORIGINS ||
  "https://google-cloud-project.vercel.app,https://northstar-cleargate.vercel.app,http://localhost:3000,http://localhost:5173")
  .split(",").map(s => s.trim());

if (!process.env.GEMINI_API_KEY) console.warn("GEMINI_API_KEY is not set - /api/evaluate will fail.");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

app.set("trust proxy", 1); // Render sits behind a proxy

// 1. Only allow your own websites to call this API
app.use(cors({ origin: ORIGINS, methods: ["GET", "POST"] }));
app.use(express.json({ limit: "1mb" }));

// 2. Protect the Gemini quota (per IP)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Evaluations are limited per 15 minutes to keep usage fair. Please try again shortly." }
});
app.use("/api/evaluate", aiLimiter); // must stay BEFORE the route below

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
