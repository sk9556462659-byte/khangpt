const fetch = require("node-fetch");

// ==========================================
// 🔧 CONFIGURATION
// ==========================================

const IS_DEV = process.env.NODE_ENV === 'development';
const log = (...args) => IS_DEV && console.log(...args);

// 🔑 API KEYS
const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5
].filter(Boolean);

// 🤖 MODELS (Priority order)
const MODELS = [
  "models/gemini-2.5-flash",
  "models/gemini-2.0-flash", 
  "models/gemini-1.5-flash",
  "models/gemini-1.5-pro"
];

// 🚨 RATE LIMITING
const rateLimit = new Map();
const RATE_WINDOW = 60000;
const MAX_REQ = 10;

// 🧠 MEMORY (Note: Use Redis in production)
const userMemory = {};

// ==========================================
// 🛡️ SECURITY & RATE LIMIT
// ==========================================

function checkRateLimit(userId) {
  const now = Date.now();
  const user = rateLimit.get(userId) || { count: 0, reset: now + RATE_WINDOW };
  
  if (now > user.reset) {
    user.count = 0;
    user.reset = now + RATE_WINDOW;
  }
  
  if (user.count >= MAX_REQ) {
    return { allowed: false, wait: Math.ceil((user.reset - now) / 1000) };
  }
  
  user.count++;
  rateLimit.set(userId, user);
  return { allowed: true };
}

function sanitize(text) {
  return text
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

// ==========================================
// 🌐 LANGUAGE SYSTEM (FIXED #1, #2)
// ==========================================

// Hinglish keywords (expanded)
const HINGLISH_WORDS = new Set([
  'hai', 'nahi', 'nahee', 'nai', 'kya', 'kaise', 'kaisa', 'kaisi',
  'karo', 'karoo', 'kr', 'kro', 'bhai', 'bhay', 'yaar', 'yar',
  'bolo', 'bol', 'kahan', 'kaha', 'kidhar', 'mera', 'tera', 'teraa',
  'dekh', 'dhek', 'dekho', 'suno', 'sun', 'achha', 'acha', 'theek',
  'thik', 'tik', 'bht', 'bahut', 'bohot', 'hn', 'haan', 'hnn',
  'rha', 'raha', 'rahi', 'gya', 'gaya', 'gyi', 'gayi', 'dia', 'diya',
  'liye', 'liya', 'kar', 'raha', 'hu', 'hun', 'hoon', 'thi', 'tha',
  'gya', 'chahiye', 'chiye', 'pata', 'pta', 'nhi', 'nh', 'bta',
  'bata', 'btao', 'batao', 'jao', 'jaao', 'aao', 'aaoo', 'kro',
  'krna', 'karna', 'krni', 'karni', 'krne', 'karne', 'wala', 'wali',
  'sa', 'se', 'me', 'main', 'mai', 'ko', 'ka', 'ki', 'ke', 'ne',
  'bhi', 'hi', 'to', 'bata', 'do', 'lo', 'le', 'de', 're', 'h',
  'k', 'n', 'm', 't', 'y', 'b', 'd', 's', 'l', 'r', 'j', 'p',
  'tm', 'tum', 'ap', 'aap', 'mjhe', 'mujhe', 'mujh', 'tujh', 'tujhe',
  'isko', 'usko', 'is', 'us', 'yeh', 'ye', 'woh', 'wo', 'w',
  'zra', 'zara', 'thoda', 'thora', 'bhut', 'zyada', 'jada', 'jyada',
  'kam', 'km', 'zyada', 'ziyada', 'acha', 'accha', 'thik', 'theek',
  'hnji', 'hanji', 'ji', 'g', 'ji g', 'han g', 'hnn g'
]);

function detectLanguage(text) {
  if (!text || typeof text !== 'string') return 'hinglish';
  
  // Script detection (Priority 1)
  const hasUrdu = /[\u0600-\u06FF]/.test(text);
  const hasHindi = /[\u0900-\u097F]/.test(text);
  const hasEnglish = /[a-zA-Z]/.test(text);
  
  // If scripts present, prioritize by count (FIX #2)
  if (hasUrdu || hasHindi) {
    const urduCount = (text.match(/[\u0600-\u06FF]/g) || []).length;
    const hindiCount = (text.match(/[\u0900-\u097F]/g) || []).length;
    
    if (urduCount > hindiCount) return 'urdu';
    if (hindiCount > urduCount) return 'hindi';
    // Equal or mixed: default to user's likely intent
    return hasUrdu ? 'urdu' : 'hindi';
  }
  
  // No scripts - check for Hinglish vs English (FIX #1)
  if (hasEnglish) {
    const words = text.toLowerCase().split(/[\s\W]+/).filter(w => w.length > 1);
    const hinglishMatches = words.filter(w => HINGLISH_WORDS.has(w)).length;
    
    // If 20%+ words are Hinglish keywords → Hinglish
    if (words.length > 0 && (hinglishMatches / words.length) > 0.2) {
      return 'hinglish';
    }
    
    // Check for Hinglish patterns (Roman endings)
    const hinglishPatterns = /(hai|nahi|kya|kaise|bhai|yaar|mera|tera|dekh|suno)$/i;
    if (hinglishPatterns.test(text.trim())) return 'hinglish';
    
    return 'english';
  }
  
  return 'hinglish';
}

function getLangRule(lang) {
  const rules = {
    urdu: `🚨 MANDATORY URDU SCRIPT ONLY:
- 100% عربی رسم الخط
- ZERO English letters (A-Z = ❌)
- ZERO Devanagari (हिंदी = ❌)
- NO mixing allowed
- BREAKING RULE = INVALID`,

    hindi: `🚨 MANDATORY DEVANAGARI ONLY:
- 100% हिंदी लिपि
- ZERO English letters (A-Z = ❌)  
- ZERO Urdu script (سلام = ❌)
- NO mixing allowed
- BREAKING RULE = INVALID`,

    hinglish: `🚨 MANDATORY ROMAN ONLY:
- 100% English alphabet (A-Z)
- ZERO Devanagari (हिंदी = ❌)
- ZERO Urdu script (سلام = ❌)
- Natural chat style (WhatsApp)
- BREAKING RULE = INVALID`,

    english: `🚨 MANDATORY ENGLISH ONLY:
- 100% English language
- ZERO non-English scripts
- Professional & clear
- BREAKING RULE = INVALID`
  };
  
  return rules[lang] || rules.hinglish;
}

// ==========================================
// 🧠 INTENT DETECTION
// ==========================================

function detectIntent(prompt) {
  const text = prompt.toLowerCase();
  const intents = {
    prompt: ['prompt', 'generate prompt', 'ai prompt', 'image prompt', 'video prompt', 'midjourney', 'stable diffusion'],
    story: ['story', 'kahani', 'khani', 'qissa', 'dastan', 'afsana'],
    code: ['code', 'script', 'program', 'function', 'app banao', 'website banao', 'code likho'],
    idea: ['idea', 'concept', 'soch', 'plan', 'suggest', 'recommend', 'kya karu'],
    translate: ['translate', 'tarjuma', 'convert language', 'urdu mein', 'hindi mein'],
    explain: ['explain', 'samjhao', 'samajh', 'batao', 'detail mein', 'kya hai', 'kaise kaam']
  };
  
  for (const [intent, keywords] of Object.entries(intents)) {
    if (keywords.some(k => text.includes(k))) return intent;
  }
  return 'chat';
}

// ==========================================
// 🧹 LANGUAGE ENFORCEMENT
// ==========================================

const LANG_CLEANERS = {
  urdu: (t) => t.replace(/[A-Za-z\u0900-\u097F]/g, ' ').replace(/\s+/g, ' ').trim(),
  hindi: (t) => t.replace(/[A-Za-z\u0600-\u06FF]/g, ' ').replace(/\s+/g, ' ').trim(),
  hinglish: (t) => t.replace(/[\u0900-\u097F\u0600-\u06FF]/g, ' ').replace(/\s+/g, ' ').trim(),
  english: (t) => t.replace(/[\u0900-\u097F\u0600-\u06FF]/g, ' ').replace(/\s+/g, ' ').trim()
};

function enforceLanguage(text, lang) {
  if (!text || !LANG_CLEANERS[lang]) return text;
  
  // Remove AI labels
  text = text.replace(/^(Assistant|AI|KhanGPT|System):?\s*/gi, '');
  
  // Hard clean
  let cleaned = LANG_CLEANERS[lang](text);
  
  // If too short after cleaning, use fallback
  if (cleaned.length < 3) {
    cleaned = getFallback(lang);
  }
  
  return cleaned;
}

// ==========================================
// 🚀 MAIN HANDLER
// ==========================================

module.exports = async function handler(req, res) {
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed", lang: "english" });
  }

  const { prompt, lang, userId = "default" } = req.body;

  // Rate limit
  const rate = checkRateLimit(userId);
  if (!rate.allowed) {
    return res.status(429).json({
      text: `⏱️ Bahut tez! ${rate.wait}s wait karo.`,
      lang: "hinglish",
      error: "rate_limit"
    });
  }

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ 
      text: "❌ Kuch likh toh sahi!", 
      lang: "hinglish",
      error: "empty"
    });
  }

  // Sanitize & prepare
  let userPrompt = sanitize(prompt).slice(0, 2000);
  if (!isNaN(userPrompt) && userPrompt !== '') {
    userPrompt = `User wants ${userPrompt} words.`;
  }

  // Detect language
  const detectedLang = (lang && LANG_CLEANERS[lang]) ? lang : detectLanguage(userPrompt);
  log(`[${userId}] Lang: ${detectedLang}`);

  // Memory
  if (!userMemory[userId]) userMemory[userId] = [];
  const history = userMemory[userId];
  const context = history.slice(-4).map(h => `${h.role}: ${h.text}`).join("\n");

  // Build prompt
  const systemPrompt = `
YOU ARE KhanGPT AI - PREMIUM MULTILINGUAL ASSISTANT.

🔴 CRITICAL (NEVER BREAK):
1. LANGUAGE LOCK: ${detectedLang.toUpperCase()} ONLY
2. NO SCRIPT MIXING - EVER
3. USER MIXES ≠ YOU MIX. You stay locked.
4. WRONG SCRIPT = SYSTEM ERROR

INTENT: ${detectIntent(userPrompt)}

${getLangRule(detectedLang)}

CONTEXT:
${context || "[Start]"}

USER: ${userPrompt}

OUTPUT: Pure ${detectedLang}, detailed, natural.`;

  // Try all models & keys
  for (const model of MODELS) {
    for (let i = 0; i < API_KEYS.length; i++) {
      const key = API_KEYS[i];
      if (!key) continue;

      try {
        log(`[TRY] ${model} / key-${i+1}`);
        
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemPrompt }] }],
              generationConfig: {
                temperature: 0.7,
                topP: 0.9,
                topK: 40,
                maxOutputTokens: 2048
              },
              // ✅ SAFE SETTINGS (FIX #5)
              safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
              ]
            })
          }
        );

        const data = await resp.json();

        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          let reply = data.candidates[0].content.parts[0].text;
          reply = enforceLanguage(reply, detectedLang);
          
          // Save memory
          history.push({ role: "User", text: userPrompt });
          history.push({ role: "AI", text: reply });
          if (history.length > 10) userMemory[userId] = history.slice(-10);

          log(`[OK] ${model} / key-${i+1}`);
          
          return res.status(200).json({ 
            text: reply,
            lang: detectedLang,
            model: model
          });
        }

        const err = data.error?.message || '';
        log(`[ERR] ${model}/${i+1}: ${err.slice(0, 50)}`);
        
        if (!isQuotaError(err) && !err.includes('model')) break;

      } catch (e) {
        log(`[NET] ${model}/${i+1}: ${e.message}`);
      }
    }
  }

  // Fail
  return res.status(200).json({
    text: getFallback(detectedLang),
    lang: detectedLang,
    error: "fail"
  });
};

// ==========================================
// 🆘 UTILS
// ==========================================

function getFallback(lang) {
  const f = {
    urdu: "⚠️ معذرت، نظام مصروف ہے۔ براہ کرم دوبارہ کوشش کریں۔",
    hindi: "⚠️ क्षमा करें, सिस्टम व्यस्त है। कृपया पुनः प्रयास करें।",
    hinglish: "⚠️ System busy hai. Thodi der baad try karo.",
    english: "⚠️ System busy. Please try again shortly."
  };
  return f[lang] || f.hinglish;
}

function isQuotaError(msg) {
  if (!msg) return false;
  const m = msg.toLowerCase();
  return ['quota', 'limit', 'exceeded', '429', 'resource', 'billing'].some(x => m.includes(x));
}