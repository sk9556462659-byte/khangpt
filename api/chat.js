const fetch = require("node-fetch");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { prompt } = req.body;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    // --- 🚀 MODELS KI LIST (Priority wise) ---
    // Sabse pehle Flash try hoga (Fast), phir Pro (Smart)
    const models = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro"
    ];

    let lastError = "";

    // Loop chalayenge har model ko test karne ke liye
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

            // Agar model ne sahi jawab diya
            if (data.candidates && data.candidates[0].content) {
                const aiText = data.candidates[0].content.parts[0].text;
                
                // Response ke saath Unlimited Access (No credit minus)
                return res.status(200).json({ 
                    text: aiText,
                    modelUsed: model // Debugging ke liye dekh sakte hain kaunsa model chala
                });
            } else {
                lastError = data.error ? data.error.message : "Model failed";
                console.log(`Model ${model} fail ho gaya, agla try kar rahe hain...`);
                continue; // Agle model par jao
            }
        } catch (err) {
            lastError = err.message;
            continue;
        }
    }

    // Agar saare models fail ho jayein
    return res.status(200).json({ 
        text: "Maaf kijiyega, abhi saare AI models busy hain. Error: " + lastError 
    });
};