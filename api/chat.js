const fetch = require("node-fetch");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { prompt } = req.body;

    // Vercel se keys uthayega
    const apiKeys = [
        process.env.GEMINI_API_KEY_1,
        process.env.GEMINI_API_KEY_2,
        process.env.GEMINI_API_KEY_3
    ].filter(k => k);

    // Agar Vercel mein keys nahi hain
    if (apiKeys.length === 0) {
        return res.status(200).json({ text: "KhanGPT Error: Vercel mein koi API Key nahi mili!" });
    }

    const models = ["gemini-1.5-flash", "gemini-1.5-pro"];

    for (let i = 0; i < apiKeys.length; i++) {
        for (const model of models) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKeys[i]}`;
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: "Aapka naam KhanGPT hai. User ka sawal: " + (prompt || "Hi") }] }]
                    })
                });

                const data = await response.json();

                if (data.candidates && data.candidates[0]?.content) {
                    return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
                }

                // Agar Google error de raha hai toh humein pata chal jayega
                console.log(`Key ${i+1} failed: ${data.error?.message || "Unknown error"}`);

            } catch (err) {
                continue;
            }
        }
    }

    return res.status(200).json({ 
        text: "Bhai, sabhi " + apiKeys.length + " keys try kar li hain, par Google jawab nahi de raha. Kripya apni API Keys ko AI Studio mein ja kar dobara check karein." 
    });
};