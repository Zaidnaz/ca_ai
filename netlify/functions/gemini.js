import { GoogleGenerativeAI } from "@google/generative-ai";

const OUT_OF_SCOPE_REPLY = "I can help only with Chartered Accountant topics such as Income Tax, GST, TDS, ITR filing, deductions, audits, accounting, and compliance. Please ask a CA-related question.";

const IN_SCOPE_KEYWORDS = [
    "ca", "chartered accountant", "accounting", "bookkeeping", "audit", "tax", "income tax", "gst", "tds", "tds return",
    "itr", "return filing", "deduction", "80c", "80d", "section", "advance tax", "capital gain", "huf", "salary", "form 16",
    "balance sheet", "profit and loss", "p&l", "invoice", "input tax credit", "itc", "compliance", "roc", "company act", "llp"
];

const STRONGLY_OUT_OF_SCOPE_KEYWORDS = [
    "recipe", "cook", "movie", "song", "lyrics", "football", "cricket score", "gaming", "travel", "hotel", "weather",
    "medical", "doctor", "diagnosis", "workout", "gym", "dating", "romance", "joke", "poem", "story", "code", "javascript",
    "python", "java", "react", "css", "html", "debug", "algorithm"
];

function isCaScopeQuestion(prompt) {
    const text = String(prompt || "").toLowerCase();
    const hasInScope = IN_SCOPE_KEYWORDS.some((keyword) => text.includes(keyword));
    const hasOutOfScope = STRONGLY_OUT_OF_SCOPE_KEYWORDS.some((keyword) => text.includes(keyword));

    if (hasInScope) return true;
    if (hasOutOfScope) return false;
    return false;
}

export const handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        // This securely grabs the Key Pair you set in Netlify Dashboard
        const apiKey = process.env.GEMINI_API_KEY; 
        if (!apiKey) return { statusCode: 500, body: JSON.stringify({ reply: "API Key missing on server." }) };

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const { text } = JSON.parse(event.body);
        if (!text || typeof text !== "string") {
            return { statusCode: 400, body: JSON.stringify({ reply: "Prompt is required" }) };
        }

        if (!isCaScopeQuestion(text)) {
            return { statusCode: 200, body: JSON.stringify({ reply: OUT_OF_SCOPE_REPLY }) };
        }

        const guardedPrompt = [
            "You are an AI Chartered Accountant assistant.",
            "Answer only CA-related topics: Indian taxation, GST, TDS, ITR filing, accounting, audit, and compliance.",
            "If a question is outside CA scope, respond exactly with:",
            OUT_OF_SCOPE_REPLY,
            "Keep valid answers concise and practical.",
            `User question: ${text}`
        ].join("\n");

        const result = await model.generateContent(guardedPrompt);
        const response = await result.response;
        
        return {
            statusCode: 200,
            body: JSON.stringify({ reply: response.text() })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ reply: "Error: " + error.message }) };
    }
};


