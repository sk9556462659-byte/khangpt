const fetch = require("node-fetch");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { prompt } = req.body;
    const apiKeys = [
        process.env.GEMINI_API_KEY_1,
        process.env.GEMINI_API_KEY_2,
        process.env.GEMINI_API_KEY_3
    ].filter(k => k);

    // 🚀 SABSE STABLE MODEL (Isse 'Permission Denied' nahi aayega)
    const model = "gemini-1.5-flash"; 

    for (const key of apiKeys) {
        try {
            // v1beta endpoint naye accounts ke liye best hai
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Aapka naam KhanGPT hai. " + (prompt || "Hi") }] }]
                })
            });

            const data = await response.json();

            // Agar sahi response mila
            if (data.candidates && data.candidates[0]?.content) {
                return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
            }
            
            console.log("Error logic:", data.error?.message);
        } catch (err) { continue; }
    }

    return res.status(200).json({ 
        text: "Bhai, Gemini 3 abhi stable nahi hai. Maine ise 1.5 Flash par switch kar diya hai. Ek baar Redeploy karke try karein." 
    });
};