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
        // Direct Fetch Call (Version v1beta ki jagah v1 use kar rahe hain jo stable hai)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_KEY}`, {
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

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            const aiText = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ text: aiText });
        } else {
            throw new Error(JSON.stringify(data));
        }

    } catch (error) {
        console.error("Gemini Error:", error);
        return res.status(500).json({ error: "AI Error: " + error.message });
    }
};