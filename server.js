import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Google GenAI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(async (req, res) => {
  const pathName = req.path;
  const prompt = `
  A visitor has opened the path '${pathName}' on a website.
  Generate a complete HTML page with inline CSS and JS.
  The page should be:
  
  1. Modern, responsive, and mobile-friendly.
  2. Visually appealing: use colors, spacing, fonts, and subtle animations.
  3. Interactive: include buttons, links, hover effects, modals, or simple animations.
  4. Structured: have a clear header, content section, and footer.
  5. Dynamic: content should reflect the path name (e.g., for /about, make an About section).
  6. Self-contained: all CSS and JS should be inline, no external dependencies, dont use any image.
  7. Realistic: make it feel like a real website, not a generic template.
  8. Do NOT mention AI, generators, or Google.
  
  Output only the final HTML content, nothing else.
  `;
  


  try {
    const response = await ai.models.generateContent({
      model: "Gemini 2.5 Flash",
      contents: prompt,
    });

    const html = response.text || "<h1>No content generated</h1>";
    res.setHeader("Content-Type", "text/html");
    res.send(html);

  } catch (err) {
    console.error("API Error:", err.message);
    res.status(500).send("<h1>Server error. Try again.</h1>");
  }
});

app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
