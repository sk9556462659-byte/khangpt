const fetch = require("node-fetch");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { prompt } = req.body;

    // 🚀 MULTIPLE KEYS ROTATION
    const apiKeys = [
        process.env.GEMINI_KEY_1,
        process.env.GEMINI_KEY_2,
        process.env.GEMINI_KEY_3
    ].filter(k => k); // Khali keys ko hata dega

    const models = ["gemini-1.5-flash", "gemini-1.5-pro"];

    // Har Key ko baari-baari try karega
    for (const key of apiKeys) {
        for (const model of models) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${key}`;
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ 
                            parts: [{ text: "Aapka naam KhanGPT hai. User: " + (prompt || "Hi") }] 
                        }],
                        safetySettings: [
                            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
                        ]
                    })
                });

                const data = await response.json();

                // Agar response mil gaya toh seedha bhej do
                if (data.candidates && data.candidates[0]?.content?.parts) {
                    return res.status(200).json({ 
                        text: data.candidates[0].content.parts[0].text 
                    });
                }

                // Agar 429 (Rate Limit) hai toh agali key par jao
                if (response.status === 429) {
                    console.log(`Key limit hit for ${model}, switching...`);
                    continue; 
                }

            } catch (err) {
                console.error("Error in loop:", err.message);
                continue;
            }
        }
    }

    // Agar sab kuch fail ho jaye
    return res.status(200).json({ 
        text: "Bhai, KhanGPT abhi bohot zyada busy hai. Saari API keys ki limit hit ho gayi hai. 1 minute baad try karein." 
    });
};