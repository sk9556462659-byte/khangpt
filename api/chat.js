const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { prompt } = req.body;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_KEY) {
        return res.status(500).json({ error: "Config Error: API Key missing in Vercel Settings" });
    }

    try {
        const genAI = new GoogleGenerativeAI(GEMINI_KEY);
        
        // --- FIX: Model ka naam "gemini-1.5-flash" ki jagah "gemini-pro" ya "gemini-1.5-flash-latest" try karein ---
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        
        const result = await model.generateContent(prompt || "Hi");
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({ text: text });
    } catch (error) {
        console.error("Gemini Error:", error);
        // Detail error dikhane ke liye
        return res.status(500).json({ error: "AI Error: " + error.message });
    }
};