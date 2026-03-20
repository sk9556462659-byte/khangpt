// Rate limiting map
const rateLimitMap = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxRequests = 5; 

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
  if (prompt.length < 3 || prompt.length > 500) return false;

  const bannedWords = ["nsfw", "porn", "nude", "sex", "blood", "violence"];
  const lower = prompt.toLowerCase();

  return !bannedWords.some(word => lower.includes(word));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || 
             req.socket?.remoteAddress || 
             "unknown";

  if (isRateLimited(ip)) {
    return res.status(429).json({
      error: "Bahut zyada requests! Please 10 minute intezar karein."
    });
  }

  const { prompt } = req.body;

  if (!isValidPrompt(prompt)) {
    return res.status(400).json({
      error: "Prompt galat hai ya ismein banned words hain."
    });
  }

  const FAL_KEY = process.env.FAL_KEY;

  if (!FAL_KEY) {
    return res.status(500).json({ error: "Server configuration (FAL_KEY) missing" });
  }

  try {
    // 🚀 Flux Model use kar rahe hain jo sabse best hai
    const response = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt,
        image_size: "landscape_4_3", // Aap ise 'square' bhi kar sakte hain
        num_inference_steps: 4,
        sync_mode: true
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("FAL API error:", response.status, errText);
      return res.status(response.status).json({ error: "AI Service busy hai" });
    }

    const data = await response.json();

    // Flux model ka response structure handle karna
    const imageUrl = data?.images?.[0]?.url;

    if (!imageUrl) {
      return res.status(500).json({ error: "AI se image URL nahi mila" });
    }

    return res.status(200).json({ url: imageUrl });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}