const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini using the secure key from your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.evaluateCandidate = functions.https.onRequest((req, res) => {
  // CORS allows your frontend website to talk to this backend function
  cors(req, res, async () => {
    
    // Security check: Only accept POST requests
    if (req.method !== "POST") {
      return res.status(405).send({ error: "Method Not Allowed" });
    }

    try {
      const promptText = req.body.prompt;
      
      if (!promptText) {
        return res.status(400).send({ error: "No prompt provided." });
      }

      // Call the Gemini model
      const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.5-flash" });
      const result = await model.generateContent(promptText);
      const response = await result.response;
      const text = response.text();

      // Send the AI's evaluation back to the frontend
      res.status(200).send({ aiResponse: text });

    } catch (error) {
      console.error("Gemini AI Error:", error);
      res.status(500).send({ error: "Failed to process AI evaluation." });
    }
  });
});