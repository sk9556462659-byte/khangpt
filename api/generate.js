// Rate limiting map (Memory mein rahega, Vercel par restart hone par reset ho sakta hai)
const rateLimitMap = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxRequests = 5; // Maine ise 10 se 5 kar diya hai safety ke liye

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  // Purane timestamps filter karein jo 10 min se purane hain
  let timestamps = rateLimitMap.get(ip).filter(ts => now - ts < windowMs);

  if (timestamps.length >= maxRequests) {
    return true;
  }

  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return false;
}

function isValidPrompt(prompt) {
  if (!prompt || typeof prompt !== "string") return false;
  if (prompt.length < 3 || prompt.length > 500) return false;

  // Zyada banned words add kiye hain
  const bannedWords = ["nsfw", "porn", "nude", "sex", "blood", "violence"];
  const lower = prompt.toLowerCase();

  return !bannedWords.some(word => lower.includes(word));
}

export default async function handler(req, res) {
  // Sirf POST request allow karein
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // IP Address nikalna (Vercel/Proxy support ke saath)
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || 
             req.socket?.remoteAddress || 
             "unknown";

  if (isRateLimited(ip)) {
    return res.status(429).json({
      error: "Too many requests. Please wait 10 minutes."
    });
  }

  const { prompt } = req.body;

  if (!isValidPrompt(prompt)) {
    return res.status(400).json({
      error: "Invalid prompt. Please provide a safe and descriptive prompt (3-500 chars)."
    });
  }

  // ⚠️ Vercel Dashboard mein FAL_KEY set karna zaroori hai
  const FAL_KEY = process.env.FAL_KEY;

  if (!FAL_KEY) {
    console.error("FAL_KEY missing in Env Variables");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const response = await fetch("https://fal.run/fal-ai/fast-sdxl", {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_KEY}`, // 'Bearer' ki jagah 'Key' use hota hai Fal AI mein
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt,
        image_size: "square_hd",
        sync_mode: true
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("FAL API error:", response.status, errText);
      return res.status(response.status).json({ error: "AI Service error" });
    }

    const data = await response.json();

    // Image URL nikalne ka sahi tareeka
    const imageUrl = data?.images?.[0]?.url || data?.output?.images?.[0]?.url;

    if (!imageUrl) {
      return res.status(500).json({ error: "Failed to get image URL from AI" });
    }

    return res.status(200).json({ url: imageUrl });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}