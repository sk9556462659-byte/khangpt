// ===== SIMPLE IN-MEMORY RATE LIMIT =====
const rateLimitMap = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxRequests = 10;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  const timestamps = rateLimitMap.get(ip).filter(ts => now - ts < windowMs);
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);

  return timestamps.length > maxRequests;
}

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get user IP
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket?.remoteAddress ||
    "unknown";

  // Rate limit check
  if (isRateLimited(ip)) {
    return res.status(429).json({
      error: "Too many requests. Please wait 10 minutes."
    });
  }

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Invalid prompt" });
  }

  if (prompt.length > 500) {
    return res.status(400).json({ error: "Prompt too long" });
  }

  const FAL_KEY = process.env.FAL_KEY;

  // ===== If No API Key → Demo Mode =====
  if (!FAL_KEY) {
    return res.status(200).json({
      url: "https://images.unsplash.com/photo-1682686580391-615b8b8e0f4c"
    });
  }

  try {

    const response = await fetch("https://fal.run/fal-ai/fast-sdxl", {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt,
        image_size: "square_hd"
      })
    });

    const data = await response.json();

    console.log("FAL Response:", data);

    // Real success
    if (data.images && data.images[0]?.url) {
      return res.status(200).json({ url: data.images[0].url });
    }

    if (data.output && data.output[0]?.url) {
      return res.status(200).json({ url: data.output[0].url });
    }

    // If API error or balance exhausted → Demo fallback
    return res.status(200).json({
      url: "https://images.unsplash.com/photo-1682686580391-615b8b8e0f4c"
    });

  } catch (error) {
    console.error("Server error:", error);

    // Any crash → Demo fallback
    return res.status(200).json({
      url: "https://images.unsplash.com/photo-1682686580391-615b8b8e0f4c"
    });
  }
}