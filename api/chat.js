const fetch = require("node-fetch");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { prompt } = req.body;

    // 🚀 PERFECT MATCH NAMES
    const apiKeys = [
        process.env.GEMINI_API_KEY_1,
        process.env.GEMINI_API_KEY_2,
        process.env.GEMINI_API_KEY_3
    ].filter(k => k); // Sirf wahi keys uthayega jo khali nahi hain

    // Sabse stable model
    const model = "gemini-1.5-flash";

    for (const key of apiKeys) {
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

            if (data.candidates && data.candidates[0]?.content) {
                return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
            }
        } catch (err) {
            continue; // Agali key try karo
        }
    }

    return res.status(200).json({ 
        text: "KhanGPT Error: Ya toh Keys refresh nahi hui hain ya Vercel ne naye naam nahi uthaye. Please Redeploy karein." 
    });
};