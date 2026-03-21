const fetch = require("node-fetch");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { prompt } = req.body;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    // --- 🚀 STABLE MODELS ONLY ---
    // Flash sabse fast hai aur v1 par chalta hai
    const models = [
        "gemini-1.5-flash",
        "gemini-1.5-pro"
    ];

    for (const model of models) {
        try {
            // Google ka sabse stable v1 endpoint use kar rahe hain
            const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GEMINI_KEY}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Aapka naam KhanGPT hai. User: " + (prompt || "Hi") }] }]
                })
            });

            const data = await response.json();

            // Agar model ne sahi jawab diya toh seedha return karein
            if (data.candidates && data.candidates[0].content) {
                const aiText = data.candidates[0].content.parts[0].text;
                // Yahan koi credit minus nahi ho raha = UNLIMITED 🚀
                return res.status(200).json({ text: aiText });
            }
            
            console.log(`Model ${model} fail hua, agla check kar rahe hain...`);
        } catch (err) {
            continue; // Agle model par jao
        }
    }

    // Agar sab fail ho jayein toh user-friendly message
    return res.status(200).json({ 
        text: "KhanGPT abhi busy hai ya API key ki limit khatam ho gayi hai. Kripya 1 minute baad koshish karein." 
    });
};