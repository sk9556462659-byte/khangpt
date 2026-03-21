const fetch = require("node-fetch");

module.exports = async function handler(req, res) {
    const { prompt } = req.body;
    const key = process.env.GEMINI_API_KEY_1; // Sirf pehli key use karein

    try {
        // v1 endpoint aur stable 1.5 model use kar rahe hain
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt || "Hi" }] }]
            })
        });

        const data = await response.json();

        if (data.candidates && data.candidates[0]?.content) {
            return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
        }

        // Agar error aaye toh humein EXACT Google ka error dikhao
        return res.status(200).json({ text: "Google Error: " + (data.error?.message || "Check Keys") });

    } catch (err) {
        return res.status(200).json({ text: "System Error: " + err.message });
    }
};