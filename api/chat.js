const fetch = require("node-fetch");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { prompt } = req.body;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_KEY) {
        return res.status(500).json({ error: "Config Error: API Key missing" });
    }

    try {
        // --- UPDATED: Model name to gemini-1.5-flash ---
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt || "Hello"
                    }]
                }]
            })
        });

        const data = await response.json();

        // Error checking
        if (data.error) {
            throw new Error(data.error.message || JSON.stringify(data.error));
        }

        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
            const aiText = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ text: aiText });
        } else {
            throw new Error("Unexpected response format from Google AI");
        }

    } catch (error) {
        console.error("Gemini Error:", error);
        return res.status(500).json({ error: "AI Error: " + error.message });
    }
};