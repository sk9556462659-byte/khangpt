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
        // --- 🚀 NEW STABLE ENDPOINT ---
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt || "Hi"
                    }]
                }]
            })
        });

        const data = await response.json();

        // Check if Google returned an error
        if (data.error) {
            // Agar ye fail ho, toh fallback to 'gemini-pro'
            console.log("Flash failed, trying Pro...");
            return handleFallback(prompt, GEMINI_KEY, res);
        }

        if (data.candidates && data.candidates[0].content) {
            const aiText = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ text: aiText });
        } else {
            return res.status(500).json({ error: "AI Response error" });
        }

    } catch (error) {
        return res.status(500).json({ error: "Server Error: " + error.message });
    }
};

// --- Fallback function agar Flash model na mile ---
async function handleFallback(prompt, key, res) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        return res.status(200).json({ text: text });
    } catch (e) {
        return res.status(500).json({ error: "Both models failed. Check API Key." });
    }
}