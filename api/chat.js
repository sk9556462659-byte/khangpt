const fetch = require("node-fetch");

// 2 second rukne ka function
const wait = (ms) => new Promise(res => setTimeout(res, ms));

module.exports = async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { prompt } = req.body;

    // 🚀 EXACT NAMES FROM YOUR VERCEL SETTINGS
    const apiKeys = [
        process.env.GEMINI_API_KEY_1,
        process.env.GEMINI_API_KEY_2,
        process.env.GEMINI_API_KEY_3
    ].filter(k => k);

    // Agar Vercel mein keys nahi mili toh ye error dikhayega
    if (apiKeys.length === 0) {
        return res.status(200).json({ text: "System Error: Vercel mein Keys nahi mili. Naam check karein!" });
    }

    const models = ["gemini-1.5-flash", "gemini-1.5-pro"];

    for (const key of apiKeys) {
        for (const model of models) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${key}`;
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: "Aapka naam KhanGPT hai. User: " + (prompt || "Hi") }] }]
                    })
                });

                const data = await response.json();

                if (data.candidates && data.candidates[0]?.content?.parts) {
                    // Success! No credits deducted from Firebase.
                    return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
                }

                if (response.status === 429) {
                    await wait(2000); 
                    continue; 
                }

            } catch (err) {
                continue;
            }
        }
    }

    return res.status(200).json({ 
        text: "KhanGPT abhi limit par hai. Kripya 20 seconds baad phir se koshish karein." 
    });
};