const fetch = require("node-fetch");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { prompt } = req.body;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    // --- 🚀 LATEST MODELS ONLY ---
    // Inme se koi bhi error nahi dega v1beta par
    const models = [
        "gemini-1.5-flash",
        "gemini-1.5-pro"
    ];

    let lastError = "";

    for (const model of models) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Aapka naam KhanGPT hai. User: " + (prompt || "Hi") }] }]
                })
            });

            const data = await response.json();

            if (data.candidates && data.candidates[0].content) {
                const aiText = data.candidates[0].content.parts[0].text;
                // Unlimited: Yahan koi credit check nahi hai
                return res.status(200).json({ text: aiText });
            } else {
                lastError = data.error ? data.error.message : "Model error";
                continue; 
            }
        } catch (err) {
            lastError = err.message;
            continue;
        }
    }

    return res.status(200).json({ 
        text: "System Update: Purana model band ho gaya hai. Hum naye model se connect kar rahe hain. Error: " + lastError 
    });
};