const fetch = require("node-fetch");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { prompt } = req.body;
    // Vercel Dashboard se key uthayega
    const apiKey = process.env.GEMINI_API_KEY_1;

    try {
        // 🚀 LATEST 2026 STABLE ENDPOINT
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Aap KhanGPT hain. User ka sawal: " + (prompt || "Hi") }] }]
            })
        });

        const data = await response.json();

        // Agar response mil jaye
        if (data.candidates && data.candidates[0]?.content) {
            return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
        }

        // Error handling for debugging
        const errorMsg = data.error ? data.error.message : "API check fail hui.";
        return res.status(200).json({ text: "Google AI Studio Error: " + errorMsg });

    } catch (err) {
        return res.status(200).json({ text: "Server Crash Error: " + err.message });
    }
};