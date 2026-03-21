const fetch = require("node-fetch");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY_1;

    try {
        // Sabse stable v1 endpoint aur 1.5-flash model
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Aap KhanGPT hain. User ka sawal: " + (prompt || "Hi") }] }]
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0]?.content) {
            return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
        }

        // Agar phir bhi error aaye, toh asli wajah dikhayega
        return res.status(200).json({ text: "Google Response: " + (data.error?.message || "Kuch galat hua") });

    } catch (err) {
        return res.status(200).json({ text: "Server Connection Error: " + err.message });
    }
};