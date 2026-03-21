const fetch = require("node-fetch");

// ✅ 3 API KEYS AUTO SWITCH
const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3
];

// ✅ BEST STABLE MODEL
const MODEL = "models/gemini-2.5-flash";

// ✅ LANGUAGE SYSTEM
function getSystemInstruction(lang) {
  if (lang === "urdu") {
    return "Aap sirf Urdu mein jawab dein. Hindi ya English bilkul use na karein.";
  } 
  else if (lang === "english") {
    return "Reply only in English. Do not use Urdu or Hindi.";
  } 
  else if (lang === "urdu_english") {
    return "Jawab Urdu mein dein lekin English words use kar sakte hain.";
  } 
  else {
    return "User jis language mein baat kare, usi mein jawab dein.";
  }
}

module.exports = async function handler(req, res) {
  const { prompt, lang } = req.body;

  if (!prompt) {
    return res.status(400).json({ text: "Prompt missing!" });
  }

  const systemInstruction = getSystemInstruction(lang);

  let lastError = "";

  // 🔁 AUTO SWITCH API KEYS
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
                parts: [
                  {
                    text: `${systemInstruction}\n\nUser: ${prompt}`
                  }
                ]
              }
            ]
          })
        }
      );

      const data = await response.json();

      // ✅ SUCCESS
      if (data.candidates && data.candidates[0]?.content) {
        return res.status(200).json({
          text: data.candidates[0].content.parts[0].text
        });
      }

      // ❌ error → next key try
      lastError = data.error?.message || "Unknown error";

    } catch (err) {
      lastError = err.message;
    }
  }

  // 🚫 ALL KEYS FAILED → FINAL MESSAGE
  return res.status(200).json({
    text: "⚠️ KhanGPT abhi busy hai ya aapka free limit khatam ho gaya hai.\n\n⏳ Thodi der baad dobara try karein (10-15 minute).\n\n🚀 System automatically optimize ho raha hai.\n\n🙏 Shukriya — KhanGPT ❤️"
  });
};