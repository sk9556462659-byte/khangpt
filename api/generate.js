const rateLimitMap = new Map();

const MODELS = {
  fal: {
    endpoint: "https://fal.run/fal-ai/fast-sdxl"
  }
};

function success(res, payload) {
  return res.status(200).json({
    success: true,
    data: payload,
    error: null
  });
}

function fail(res, message, code = 400) {
  return res.status(code).json({
    success: false,
    data: null,
    error: message
  });
}

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
    return fail(res, "Method not allowed", 405);
  }

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  if (isRateLimited(ip)) {
    return fail(res, "Too many requests. Wait 10 minutes.", 429);
  }

  const { prompt, model = "fal" } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return fail(res, "Invalid prompt");
  }

  if (prompt.length > 500) {
    return fail(res, "Prompt too long (max 500 characters)");
  }

  const FAL_KEY = process.env.FAL_KEY;
  const demoImage =
    "https://images.unsplash.com/photo-1682686580391-615b8b8e0f4c";

  if (!FAL_KEY) {
    return success(res, { imageUrl: demoImage });
  }

  try {

    const response = await fetch(MODELS[model].endpoint, {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        image_size: "square_hd"
      })
    });

    if (!response.ok) {
      return success(res, { imageUrl: demoImage });
    }

    const data = await response.json();

    const imageUrl =
      data?.images?.[0]?.url ||
      data?.output?.[0]?.url ||
      demoImage;

    return success(res, { imageUrl });

  } catch (err) {
    return success(res, { imageUrl: demoImage });
  }
}