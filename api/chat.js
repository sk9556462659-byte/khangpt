const fetch = require("node-fetch");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { prompt } = req.body;
    
    // Vercel dashboard se keys
    const apiKeys = [
        process.env.GEMINI_API_KEY_1,
        process.env.GEMINI_API_KEY_2,
        process.env.GEMINI_API_KEY_3
    ].filter(k => k);

    for (const key of apiKeys) {
        try {
            // 🚀 STABLE V1 ENDPOINT (Naye models ke bina)
            const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Aapka naam KhanGPT hai. " + (prompt || "Hi") }] }]
                })
            });

            const data = await response.json();

            if (data.candidates && data.candidates[0]?.content) {
                return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
            }
            
            // Debugging ke liye agar abhi bhi error aaye
            console.log("Internal Error:", data.error?.message);

        } catch (err) { continue; }
    }

    return res.status(200).json({ 
        text: "KhanGPT Update: Bhai, humne v1 aur v1beta dono try kar liye. Ek baar AI Studio mein ja kar naya project banayein aur uski key use karein." 
    });
};