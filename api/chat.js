const fetch = require("node-fetch");

// ✅ API KEYS (Auto Switch System)
const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3
].filter(Boolean);

// 🚀 BEST STABLE MODEL (Tumhare list se)
const MODEL = "models/gemini-2.5-flash";

// 🧠 MEMORY (simple in-memory)
const userMemory = {};

// 🌐 LANGUAGE LOCK SYSTEM (STRONG)
function getLanguageRule(lang) {
  if (lang === "urdu") {
    return "Sirf Urdu script mein jawab dein. Hindi ya English ka ek bhi lafz use na karein.";
  }
  if (lang === "english") {
    return "Reply ONLY in English. No Urdu or Hindi allowed.";
  }
  if (lang === "urdu_english") {
    return "Jawab Urdu mein dein lekin zarurat ho to English words use kar sakte hain.";
  }
  return "User jis language mein baat kare usi mein jawab dein.";
}

module.exports = async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, lang, userId = "default" } = req.body;

  if (!prompt) {
    return res.status(400).json({ text: "Bhai pehle sawal likho!" });
  }

  // 🧹 CLEAN INPUT
  let userPrompt = prompt.toString().trim().slice(0, 1500);

  // 🧠 MEMORY LOAD
  let history = userMemory[userId] || [];

  // 🔢 NUMBER = WORD LIMIT
  if (!isNaN(userPrompt)) {
    userPrompt = `User ne ${userPrompt} words ka jawab manga hai. Pichla jawab continue karo.`;
  }

  // 🌐 LANGUAGE RULE
  const langRule = getLanguageRule(lang);

  // 🧠 CONTEXT BUILD (FAST + LIGHT)
  const context = history
    .map(h => `${h.role}: ${h.text}`)
    .join("\n")
    .slice(-1200);

  const fullPrompt = `
You are KhanGPT AI.

Rules:
- Always follow language rule strictly
- Be fast, smart and helpful
- Do not switch language
- If user asks prompt, give detailed professional prompt

Language Rule:
${langRule}

Chat History:
${context}

User:
${userPrompt}
`;

  // 🔁 AUTO KEY SWITCH SYSTEM
  for (let i = 0; i < API_KEYS.length; i++) {
    const key = API_KEYS[i];

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/${MODEL}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: {
              temperature: 0.7,
              topP: 0.9,
              maxOutputTokens: 1000
            }
          })
        }
      );

      const data = await response.json();

      if (data.candidates && data.candidates[0]?.content) {
        const reply = data.candidates[0].content.parts[0].text;

        // 💾 SAVE MEMORY (last 8 chats)
        history.push({ role: "User", text: userPrompt });
        history.push({ role: "AI", text: reply });

        if (history.length > 16) {
          history = history.slice(-16);
        }

        userMemory[userId] = history;

        return res.status(200).json({ text: reply });
      }

      console.log(`Key ${i + 1} failed:`, data.error?.message);

    } catch (err) {
      console.log(`Key ${i + 1} error:`, err.message);
    }
  }

  // 🚫 ALL KEYS FAILED
  return res.status(200).json({
    text: "⚠️ KhanGPT abhi busy hai ya free limit khatam ho gayi hai.\n⏳ 5-10 minute baad dobara try karein.\n🚀 System automatically recover ho raha hai.\n🙏 Shukriya ❤️"
  });
};