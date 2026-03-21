const fetch = require("node-fetch");

module.exports = async function handler(req, res) {

    try {

        const { prompt } = req.body;

        if (!prompt || typeof prompt !== "string") {
            return res.status(400).json({
                text: "Please enter valid prompt"
            });
        }

        const key = process.env.GEMINI_API_KEY_1;

        // 🔥 SMART LANGUAGE DETECT
        let lang = "urdu";
        const lower = prompt.toLowerCase();

        if (lower.includes("english")) lang = "english";
        else if (lower.includes("hindi")) lang = "hindi";
        else if (lower.includes("urdu")) lang = "urdu";

        // 🚫 PROMPT MODE DETECT
        let promptMode = false;
        if (lower.includes("prompt") || lower.includes("idea")) {
            promptMode = true;
        }

        // 🔒 LANGUAGE + FAST RULE
        let instruction = "";

        if (lang === "urdu") {
            instruction = `
STRICT RULE:
- Reply ONLY in Urdu
- No Hindi or English
- Keep answer short and fast
`;
        } 
        else if (lang === "english") {
            instruction = `
STRICT RULE:
- Reply ONLY in English
- Keep answer short and fast
`;
        } 
        else if (lang === "hindi") {
            instruction = `
STRICT RULE:
- Reply ONLY in Hindi
- Keep answer short and fast
`;
        }

        // 🚫 PROMPT LANGUAGE CONTROL
        if (promptMode) {
            instruction += `
IMPORTANT:
- If user asks for prompt, give it in same language
- Do NOT give English prompt if Urdu/Hindi selected
`;
        }

        // 🚀 GEMINI API CALL
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${key}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: `
${instruction}

User:
${prompt}
`
                            }
                        ]
                    }
                ]
            })
        });

        const data = await response.json();

        let reply =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "No response";

        // 🔥 EXTRA FILTER (URDU)
        if (lang === "urdu") {
            reply = reply.replace(/[A-Za-z]/g, "");
        }

        return res.status(200).json({
            text: reply
        });

    } catch (err) {
        return res.status(500).json({
            text: "Error: " + err.message
        });
    }
};