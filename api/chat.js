const fetch = require("node-fetch");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { prompt } = req.body;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    // --- 1. System Prompt (AI ko tameez sikhane ke liye) ---
    const systemInstruction = "Aapka naam KhanGPT hai. Aap ek tameezdaar aur helpful AI hain. Agar koi user gandi baat, gaali, ya galat kaam (jaise hacking) ki baat kare, toh usse sakhti se mana kar dein aur kahein ki 'Main aise sawalon ka jawab nahi de sakta'. Sirf kaam ki baaton ka jawab dein.";

    try {
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: "user", parts: [{ text: systemInstruction + "\n\nUser ka sawal: " + prompt }] }
                ],
                // --- 2. Safety Settings (Google ka internal filter) ---
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
                ]
            })
        });

        const data = await response.json();

        // Agar Google ne block kiya toh tameez wala message dikhayenge
        if (data.promptFeedback && data.promptFeedback.blockReason) {
            return res.status(200).json({ text: "Maaf kijiyega, aapka sawal hamari safety policy ke khilaf hai. Kripya sahi tarike se baat karein." });
        }

        if (data.candidates && data.candidates[0].content) {
            const aiText = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ text: aiText });
        } else {
            // Agar koi aur masla ho
            return res.status(200).json({ text: "Main is sawal ka jawab nahi de sakta. Kuch aur poochiye." });
        }

    } catch (error) {
        return res.status(500).json({ error: "Server error occurred." });
    }
};