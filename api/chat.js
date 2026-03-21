const fetch = require("node-fetch");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { prompt } = req.body;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    try {
        // Naya Stable URL
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    role: "user", 
                    parts: [{ text: "Aapka naam KhanGPT hai. Helpful rahein aur tameez se jawab dein.\n\nUser: " + prompt }] 
                }]
            })
        });

        const data = await response.json();

        // Agar response mil gaya toh seedha dikhao (Koi credit check nahi)
        if (data.candidates && data.candidates[0].content) {
            const aiText = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ text: aiText });
        } else {
            return res.status(200).json({ text: "Maaf kijiyega, main abhi jawab nahi de sakta." });
        }

    } catch (error) {
        return res.status(500).json({ error: "Server Error" });
    }
};