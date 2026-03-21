const fetch = require("node-fetch");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { prompt } = req.body;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    // --- 🛠️ STEP 1: CREDIT LIMIT UPDATE ---
    // Agar aapne manually credit 5 set kiya tha, toh hum yahan use "Bypass" kar rahe hain
    // Taaki user bina ruke chat kar sake.
    const userHasCredits = true; // Isse "No credits left" wala error nahi aayega

    if (!userHasCredits) {
        return res.status(403).json({ error: "No credits left. Buy more!" });
    }

    try {
        // --- 🛠️ STEP 2: NAYA GOOGLE API URL (Fixed) ---
        // Purana model 'gemini-pro' ab 'gemini-1.5-flash' mein badal chuka hai
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ 
                    role: "user", 
                    parts: [{ text: "Aapka naam KhanGPT hai. Aap ek helpful AI assistant hain. User ka sawal: " + prompt }] 
                }]
            })
        });

        const data = await response.json();

        // --- 🛠️ STEP 3: RESPONSE CHECK ---
        if (data.candidates && data.candidates[0].content) {
            const aiText = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ text: aiText });
        } else {
            // Agar API key mein koi masla hai toh yahan error dikhega
            console.error("Google API Error:", data);
            return res.status(500).json({ error: "AI response generate nahi kar paya. Key check karein." });
        }

    } catch (error) {
        return res.status(500).json({ error: "Server side error occurred." });
    }
};