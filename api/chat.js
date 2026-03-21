const fetch = require("node-fetch");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { prompt } = req.body;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    try {
        // --- 🚀 NEW STABLE URL (Fixed Format) ---
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt || "Hi" }] }]
            })
        });

        const data = await response.json();

        if (data.error) {
            // Agar v1 fail ho, toh fallback to v1beta with different name
            return handleFallback(prompt, GEMINI_KEY, res);
        }

        const aiText = data.candidates[0].content.parts[0].text;
        return res.status(200).json({ text: aiText });

    } catch (error) {
        return res.status(500).json({ error: "Server Error: " + error.message });
    }
};

async function handleFallback(prompt, key, res) {
    // Alternate URL format
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    if (data.candidates) {
        return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
    }
    return res.status(500).json({ error: "Google API is still rejecting the request." });
}