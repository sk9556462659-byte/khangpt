const fetch = require("node-fetch");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { prompt } = req.body;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_KEY) {
        return res.status(500).json({ error: "API Key is missing in Vercel Settings!" });
    }

    try {
        // --- Ekdum simple URL ---
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt || "hello" }] }]
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(500).json({ error: "Google API Error: " + data.error.message });
        }

        if (data.candidates && data.candidates[0].content) {
            const aiText = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ text: aiText });
        } else {
            return res.status(500).json({ error: "Response format error" });
        }

    } catch (error) {
        return res.status(500).json({ error: "Server Error: " + error.message });
    }
};