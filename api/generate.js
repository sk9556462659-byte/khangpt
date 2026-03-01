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
        prompt: prompt,
        image_size: "square_hd"
      })
    });

    const data = await response.json();

    console.log("FAL Response:", data);

    // FIXED RESPONSE HANDLING
    if (data.images && data.images[0] && data.images[0].url) {
      return res.status(200).json({ url: data.images[0].url });
    }

    if (data.output && data.output[0] && data.output[0].url) {
      return res.status(200).json({ url: data.output[0].url });
    }

    return res.status(500).json({ error: JSON.stringify(data) });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }

}