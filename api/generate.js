// Rate limiting map
const rateLimitMap = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxRequests = 10; // thoda increase kiya (better UX)

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

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

  const cleaned = prompt.trim();

  if (cleaned.length < 3 || cleaned.length > 1000) return false;

  const bannedWords = ["nsfw", "porn", "nude", "sex", "blood", "violence"];
  const lower = cleaned.toLowerCase();

  return !bannedWords.some(word => lower.includes(word));
}

export default async function handler(req, res) {

  // ✅ Only POST allowed
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ✅ Get user IP safely
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  // ✅ Rate limit check
  if (isRateLimited(ip)) {
    return res.status(429).json({
      error: "Zyada requests! 10 minute baad try karo."
    });
  }

  const { prompt } = req.body;

  // ✅ Validate prompt
  if (!isValidPrompt(prompt)) {
    return res.status(400).json({
      error: "Invalid prompt ya banned words use hua hai."
    });
  }

  const FAL_KEY = process.env.FAL_KEY;

  if (!FAL_KEY) {
    return res.status(500).json({
      error: "Server config missing (FAL_KEY)"
    });
  }

  try {
    // 🚀 BEST MODEL (Flux Schnell)
    const response = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        image_size: "landscape_4_3",
        num_inference_steps: 4,
        guidance_scale: 3.5,
        sync_mode: true
      })
    });

    // ❌ API error handle
    if (!response.ok) {
      const errText = await response.text();
      console.error("FAL API error:", response.status, errText);

      return res.status(response.status).json({
        error: "AI busy hai, thoda baad try karo."
      });
    }

    const data = await response.json();

    // ✅ SAFE extraction
    const imageUrl =
      data?.images?.[0]?.url ||
      data?.data?.images?.[0]?.url ||
      null;

    if (!imageUrl) {
      return res.status(500).json({
        error: "Image generate nahi hui."
      });
    }

    // ✅ FINAL SUCCESS
    return res.status(200).json({
      url: imageUrl
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Server error, retry karo."
    });
  }
}