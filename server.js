import express from "express";
import dotenv from "dotenv";
import { Groq } from "groq-sdk";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Load API keys and setup rotation ---
const apiKeys = process.env.GROQ_API_KEYS.split(",");
let currentKeyIndex = 0;

const getClient = () => new Groq({ apiKey: apiKeys[currentKeyIndex] });

const rotateKey = () => {
  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
  console.log(`Switched to Groq API key #${currentKeyIndex + 1}`);
};

// --- Simple caching to reduce API calls ---
const cache = {};

const htmlTemplate = (body, path) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PageShift - ${path}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 2rem; background: #f9f9f9; }
  nav a { margin-right: 1rem; text-decoration: none; color: #0070f3; }
  nav a:hover { text-decoration: underline; }
</style>
</head>
<body>
<nav>
  <a href="/home">Home</a>
  <a href="/about">About</a>
  <a href="/blog">Blog</a>
  <a href="/contact">Contact</a>
</nav>
<hr/>
${body}
</body>
</html>
`;

// --- Main endpoint ---
app.get("/*", async (req, res) => {
  const path = req.path;
  console.log(`[${new Date().toISOString()}] Path requested: ${path}`);

  if (cache[path]) return res.send(cache[path]);

  const prompt = `
    You are a web server. A request has come to path '${path}'.
    Respond ONLY with HTML/CSS/JS. Make it beautiful and functional.
    Include relative links to /home, /about, /blog, /contact.
    Include a navigation bar at the top.
    Do NOT mention AI or simulation.
  `;

  try {
    let client = getClient();
    let response;

    try {
      response = await client.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "mixtral-8x7b-32768",
      });
    } catch (err) {
      // Switch API key if rate limit is hit
      if (err.message.includes("rate limit")) {
        rotateKey();
        client = getClient();
        response = await client.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "openai/gpt-oss-20b",
        });
      } else throw err;
    }

    const content = response.choices[0]?.message?.content || "";
    const finalHTML = htmlTemplate(content, path);
    cache[path] = finalHTML; // cache the page

    res.setHeader("Content-Type", "text/html");
    res.send(finalHTML);

  } catch (err) {
    console.error(err);
    res.status(500).send("<h1>Oops! Something went wrong.</h1>");
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
