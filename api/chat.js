const fetch = require("node-fetch");

// ✅ API KEYS AUTO SWITCH
const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3
].filter(Boolean);

// ✅ STABLE MODEL
const MODEL_NAME = "models/gemini-2.5-flash";

// 🧠 MEMORY (lightweight)
const userMemory = {};

module.exports = async function handler(req, res) {

  // ❌ Only POST allowed
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, lang, userId = "default" } = req.body;

  if (!prompt) {
    return res.status(400).json({ text: "Bhai, sawal toh likho!" });
  }

  // 🧹 CLEAN PROMPT
  const userPrompt = prompt.toString().trim().slice(0, 1500);

  // 🧠 LOAD MEMORY
  let history = userMemory[userId] || [];

  // 🌐 STRONG LANGUAGE LOCK
  const systemRules = {
    urdu: "Sirf Urdu script mein jawab dein. Hindi, English aur Roman Urdu bilkul use na karein. Har jawab 100% Urdu ho.",
    english: "Respond strictly in English only. Do not use Urdu or Hindi.",
    urdu_english: "Jawab Roman Urdu aur English ka natural mix ho (Hinglish/Urdu style).",
    default: "User jis zaban mein baat kare usi mein jawab dein."
  };

  // 🔥 NUMBER INPUT FIX
  let finalPrompt = userPrompt;
  if (!isNaN(userPrompt)) {
    finalPrompt = `Continue previous response and limit it to ${userPrompt} words.`;
  }

  // 🧠 CONTEXT BUILD (optimized)
  const contextText = history
    .map(h => `${h.role}: ${h.text}`)
    .join("\n")
    .slice(-1500);

  const fullContext = `
You are KhanGPT AI (smart, fast, friendly).

Rules:
- Follow language strictly
- Never switch language randomly
- Give clear and helpful answers
- If user gives number → treat as word limit

Language Rule:
${systemRules[lang] || systemRules.default}

Conversation:
${contextText}

User: ${finalPrompt}
`;

  // 🔁 AUTO SWITCH KEYS
  for (const key of API_KEYS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/${MODEL_NAME}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullContext }] }],
            generationConfig: {
              temperature: 0.8,
              topP: 0.95,
              maxOutputTokens: 1024
            }
          })
        }
      );

      const data = await response.json();

      // ✅ SUCCESS
      if (data.candidates && data.candidates[0]?.content) {
        const aiReply = data.candidates[0].content.parts[0].text;

        // 💾 SAVE MEMORY (last 8 messages)
        history.push({ role: "User", text: finalPrompt });
        history.push({ role: "AI", text: aiReply });

        if (history.length > 16) {
          history = history.slice(-16);
        }

        userMemory[userId] = history;

        return res.status(200).json({ text: aiReply });
      }

      console.log("API Error:", data.error?.message);

    } catch (err) {
      console.error("Network Error:", err.message);
    }
  }

  // 🚫 FINAL FAIL MESSAGE
  return res.status(200).json({
    text: "⚠️ KhanGPT abhi busy hai ya free limit khatam ho gaya hai.\n\n⏳ 5-10 minute baad dobara try karein.\n\n🚀 System automatically recover ho raha hai.\n\n🙏 Shukriya ❤️"
  });
};