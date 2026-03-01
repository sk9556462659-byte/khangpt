export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt missing" });
  }

  try {

    const response = await fetch("https://fal.run/fal-ai/fast-sdxl", {
      method: "POST",
      headers: {
        "Authorization": `Key ${process.env.FAL_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt
      })
    });

    const data = await response.json();

    if (data.images && data.images.length > 0) {
      return res.status(200).json({ url: data.images[0].url });
    }

    return res.status(500).json({ error: "No image generated" });

  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }

}