const fetch = require("node-fetch");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { prompt } = req.body;
    const key = process.env.GEMINI_API_KEY_1; // Vercel se key uthayega

    try {
        // 🚀 UPDATED MODEL NAME & ENDPOINT
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Aapka naam KhanGPT hai. User ka sawal: " + (prompt || "Hi") }] }]
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0]?.content) {
            return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
        }

        // Error message for debugging
        return res.status(200).json({ 
            text: data.error ? `Google Keh Raha Hai: ${data.error.message}` : "Connection successful but no response." 
        });

    } catch (err) {
        return res.status(200).json({ text: "Server Error: " + err.message });
    }
};