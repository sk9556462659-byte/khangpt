const rateLimitMap = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
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

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Invalid prompt" });
  }

  const FAL_KEY = process.env.FAL_KEY;
  const demoImage = "https://picsum.photos/1024";

  if (!FAL_KEY) {
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
        image_size: "square_hd"
      })
    });

    if (!response.ok) {
      return res.status(200).json({ url: demoImage });
    }

    const data = await response.json();

    if (data?.images?.[0]?.url) {
      return res.status(200).json({ url: data.images[0].url });
    }

    if (data?.output?.[0]?.url) {
      return res.status(200).json({ url: data.output[0].url });
    }

    return res.status(200).json({ url: demoImage });

  } catch (error) {
    return res.status(200).json({ url: demoImage });
  }
}