const fetch = require("node-fetch");

// 🔑 API KEYS
const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3
].filter(Boolean);

// 🤖 MODEL
const MODEL = "models/gemini-2.5-flash";

// 🧠 MEMORY
const userMemory = {};

// 🌐 LANGUAGE SYSTEM
function getLangRule(lang) {
  if (lang === "urdu") {
    return "Sirf Urdu script mein jawab dein. Hindi ya English bilkul use na karein.";
  }
  if (lang === "english") {
    return "Reply ONLY in English.";
  }
  if (lang === "urdu_english") {
    return "Jawab Urdu + English mix mein dein (natural style).";
  }
  return "User jis language mein bole usi mein jawab dein.";
}

// 🧠 INTENT DETECTION
function detectIntent(prompt) {
  const text = prompt.toLowerCase();

  if (text.includes("prompt")) return "prompt";
  if (text.includes("story")) return "story";
  if (text.includes("code")) return "code";
  if (text.includes("idea")) return "idea";

  return "normal";
}

// 🚨 QUOTA CHECK
function isQuotaError(msg) {
  if (!msg) return false;
  msg = msg.toLowerCase();
  return msg.includes("quota") || msg.includes("limit") || msg.includes("exceeded");
}

module.exports = async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, lang, userId = "default" } = req.body;

  if (!prompt) {
    return res.status(400).json({ text: "Bhai pehle sawal likho!" });
  }

  let userPrompt = prompt.toString().trim().slice(0, 2000);

  // 🔢 NUMBER FIX
  if (!isNaN(userPrompt)) {
    userPrompt = `User wants ${userPrompt} words response. Continue previous answer properly.`;
  }

  // 🧠 MEMORY
  let history = userMemory[userId] || [];

  const context = history
    .map(h => `${h.role}: ${h.text}`)
    .join("\n")
    .slice(-1500);

  const langRule = getLangRule(lang);

  const intent = detectIntent(userPrompt);

  // 💡 SUPER BRAIN PROMPT
  const systemBrain = `
You are KhanGPT SUPER AI.

Your abilities:
- Understand user deeply like Google Gemini
- Detect intent automatically
- Generate powerful, detailed outputs
- If user asks for prompt → create ultra detailed professional prompt
- Always stay in selected language
- Never mix wrong language
- Be natural like human

User Intent: ${intent}

Language Rule:
${langRule}

Chat History:
${context}

User:
${userPrompt}
`;

  // 🔁 KEY SYSTEM
  for (let i = 0; i < API_KEYS.length; i++) {
    const key = API_KEYS[i];

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/${MODEL}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemBrain }] }],
            generationConfig: {
              temperature: 0.9,
              topP: 0.95,
              maxOutputTokens: 1500
            }
          })
        }
      );

      const data = await response.json();

      if (data.candidates && data.candidates[0]?.content) {
        const reply = data.candidates[0].content.parts[0].text;

        // 💾 SAVE MEMORY
        history.push({ role: "User", text: userPrompt });
        history.push({ role: "AI", text: reply });

        if (history.length > 20) {
          history = history.slice(-20);
        }

        userMemory[userId] = history;

        return res.status(200).json({ text: reply });
      }

      const errMsg = data.error?.message || "";
      console.log("Key error:", errMsg);

      if (!isQuotaError(errMsg)) {
        return res.status(200).json({
          text: "⚠️ System config issue hai."
        });
      }

    } catch (err) {
      console.log("Network error:", err.message);
    }
  }

  // 🚫 FINAL FAIL
  return res.status(200).json({
    text: "⚠️ KhanGPT abhi busy hai ya free limit khatam ho gayi hai.\n⏳ 5-10 minute baad dobara try karein.\n🚀 System recover ho raha hai.\n❤️ Shukriya"
  });
};