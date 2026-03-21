const fetch = require("node-fetch");

module.exports = async function handler(req, res) {
    const { prompt } = req.body;
    const key = process.env.GEMINI_API_KEY_1;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${key}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: prompt || "Hi" }]
                        }
                    ]
                }),
            }
        );

        const data = await response.json();

        if (data.candidates && data.candidates[0]?.content) {
            return res.status(200).json({
                text: data.candidates[0].content.parts[0].text
            });
        }

        return res.status(200).json({
            text: "Google Error: " + (data.error?.message || "Unknown")
        });

    } catch (err) {
        return res.status(200).json({
            text: "System Error: " + err.message
        });
    }
};