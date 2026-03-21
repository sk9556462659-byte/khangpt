const fetch = require("node-fetch");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { prompt } = req.body;
    
    // 🚀 DEBUG LINE: Isse pata chalega naya code chal raha hai ya purana
    console.log("KhanGPT Version 2.0 - Multi-Key System Active");

    const apiKeys = [
        process.env.GEMINI_API_KEY_1,
        process.env.GEMINI_API_KEY_2,
        process.env.GEMINI_API_KEY_3
    ].filter(k => k);

    // Agar Vercel mein keys nahi milin
    if (apiKeys.length === 0) {
        return res.status(200).json({ text: "Error: Vercel mein keys nahi mil rahi hain. Dashboard check karein!" });
    }

    for (const key of apiKeys) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
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
        } catch (err) { continue; }
    }

    return res.status(200).json({ 
        text: "System Update: Code sahi hai par Google se connection fail hua. Ek baar Vercel Logs check karein." 
    });
};