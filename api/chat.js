const fetch = require("node-fetch");

// ✅ API KEYS
const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3
];

const MODEL = "models/gemini-2.5-flash";

// 🧠 MEMORY STORE (simple)
const userMemory = {};

// 🌐 LANGUAGE SYSTEM
function getSystemInstruction(lang) {
  if (lang === "urdu") {
    return "Aap sirf Urdu mein jawab dein. Hindi ya English bilkul use na karein.";
  } else if (lang === "english") {
    return "Reply only in English. Do not use Urdu or Hindi.";
  } else if (lang === "urdu_english") {
    return "Jawab Urdu mein dein lekin English words use kar sakte hain.";
  } else {
    return "User jis language mein baat kare, usi mein jawab dein.";
  }
}

module.exports = async function handler(req, res) {
  const { prompt, lang, userId = "default" } = req.body;

  if (!prompt) {
    return res.status(400).json({ text: "Prompt missing!" });
  }

  const systemInstruction = getSystemInstruction(lang);

  // 📌 USER MEMORY LOAD
  let history = userMemory[userId] || [];

  let finalPrompt = prompt;

  // 🔥 NUMBER FIX (MAIN BUG SOLUTION)
  if (!isNaN(prompt)) {
    finalPrompt = `User wants ${prompt} words response. Continue previous prompt properly.`;
  }

  // 🧠 CONTEXT BUILD
  const contextText = history
    .map(h => `${h.role}: ${h.text}`)
    .join("\n");

  const fullPrompt = `
You are KhanGPT AI.

Rules:
- Understand previous context
- If user sends only number (like 200), treat as word limit
- Continue previous task properly

${systemInstruction}

Conversation:
${contextText}

User: ${finalPrompt}
`;

  let lastError = "";

  for (let i = 0; i < API_KEYS.length; i++) {
    const key = API_KEYS[i];

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/${MODEL}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: fullPrompt }]
              }
            ]
          })
        }
      );

      const data = await response.json();

      if (data.candidates && data.candidates[0]?.content) {
        const reply = data.candidates[0].content.parts[0].text;

        // 💾 SAVE MEMORY (last 10)
        history.push({ role: "User", text: finalPrompt });
        history.push({ role: "AI", text: reply });

        if (history.length > 10) history = history.slice(-10);

        userMemory[userId] = history;

        return res.status(200).json({ text: reply });
      }

      lastError = data.error?.message || "Unknown error";

    } catch (err) {
      lastError = err.message;
    }
  }

  return res.status(200).json({
    text: "⚠️ KhanGPT abhi busy hai ya free limit khatam ho gaya hai.\n⏳ Baad mein try karein.\n🙏 Shukriya ❤️"
  });
};