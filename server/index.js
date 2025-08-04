// index.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fetch = require("node-fetch");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.API_KEY || "AIzaSyARxwUEr_lxcYuePQnRCNocIhpEXDQhEE8";

app.post("/ask", async (req, res) => {
  const { question } = req.body;
  console.log("Received question:", question);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: question }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (response.ok && data.candidates && data.candidates[0]) {
      const answer = data.candidates[0].content.parts[0].text;
      res.json({ answer });
    } else {
      console.error("Unexpected Gemini API response:", data);
      res.status(500).json({ error: "Unexpected response from Gemini API", data });
    }
  } catch (err) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: err.message });
  }
});

async function askGemini(question, retries = 3) {
  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: question }]
        }
      ]
    });
    return result.response.text();
  } catch (err) {
    if (retries > 0 && err.status === 'UNAVAILABLE') {
      console.log("Retrying... attempts left:", retries);
      await new Promise((r) => setTimeout(r, 2000)); // wait 2 seconds
      return askGemini(question, retries - 1);
    } else {
      throw err;
    }
  }
}


app.listen(3001, () => {
  console.log("✅ Server is running on http://localhost:3001");
});
