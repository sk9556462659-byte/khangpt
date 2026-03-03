const rateLimitMap = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxRequests = 10;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  const timestamps = rateLimitMap.get(ip).filter(ts => now - ts < windowMs);

  if (timestamps.length >= maxRequests) {
    return true;
  }

  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);

  return false;
}

function isValidPrompt(prompt) {
  if (!prompt) return false;
  if (typeof prompt !== "string") return false;
  if (prompt.length < 3) return false;
  if (prompt.length > 300) return false;

  const bannedWords = ["nsfw", "porn", "nude"];
  const lower = prompt.toLowerCase();

  if (bannedWords.some(word => lower.includes(word))) {
    return false;
  }

  return true;
}

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
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
      error: "Invalid prompt. Must be 3-300 characters and safe content."
    });
  }

  const FAL_KEY = process.env.FAL_KEY;
  const demoImage = "https://picsum.photos/1024";

  if (!FAL_KEY) {
    console.warn("FAL_KEY missing. Returning demo image.");
    return res.status(200).json({ url: demoImage });
  }

  try {

    const response = await fetch("https://fal.run/fal-ai/fast-sdxl", {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        image_size: "square_hd",
        num_inference_steps: 30
      })
    });

    if (!response.ok) {
      console.error("FAL API error:", response.status);
      return res.status(response.status).json({
        error: "Image generation service error"
      });
    }

    const data = await response.json();

    const imageUrl =
      data?.images?.[0]?.url ||
      data?.output?.[0]?.url;

    if (!imageUrl) {
      return res.status(500).json({
        error: "Image generation failed"
      });
    }

    return res.status(200).json({ url: imageUrl });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: "Internal server error"
    });
  }
}