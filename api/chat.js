const fetch = require("node-fetch");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { prompt } = req.body;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    try {
        // --- 🚀 NEW STABLE URL ---
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    role: "user", 
                    parts: [{ text: "Aapka naam KhanGPT hai. Helpful aur tameezdaar rahein. User: " + (prompt || "Hi") }] 
                }]
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0].content) {
            const aiText = data.candidates[0].content.parts[0].text;
            // Unlimited: Hum yahan Firebase mein credit minus nahi kar rahe
            return res.status(200).json({ text: aiText });
        } else {
            // Agar API key mein masla ho toh ye message dikhega
            return res.status(200).json({ text: "AI Response Error: " + (data.error ? data.error.message : "Check API Key in Vercel") });
        }

    } catch (error) {
        return res.status(500).json({ error: "Server Error: " + error.message });
    }
};