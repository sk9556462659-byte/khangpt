const fetch = require("node-fetch");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { prompt } = req.body;
    const apiKeys = [
        process.env.GEMINI_API_KEY_1,
        process.env.GEMINI_API_KEY_2,
        process.env.GEMINI_API_KEY_3
    ].filter(k => k);

    for (const key of apiKeys) {
        try {
            // gemini-1.5-flash sabse zyada free requests deta hai
            const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: "Aap KhanGPT hain. " + (prompt || "Hi") }] }]
                })
            });

            const data = await response.json();
            if (data.candidates && data.candidates[0]?.content) {
                return res.status(200).json({ text: data.candidates[0].content.parts[0].text });
            }
        } catch (err) { continue; }
    }

    return res.status(200).json({ text: "Bhai, saari keys ki limit khatam ho gayi hai. Nayi key add karein." });
};