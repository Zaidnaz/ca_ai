import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = "gemini-2.5-flash";
const MAX_RETRIES = 2;
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

    // Default to soft rejection when the query does not clearly indicate CA context.
    return false;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error) {
    const message = String(error?.message || "").toLowerCase();
    return message.includes("503") || message.includes("service unavailable") || message.includes("high demand");
}

async function generateWithRetry(genAI, prompt) {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const guardedPrompt = [
        "You are an AI Chartered Accountant assistant.",
        "Answer only CA-related topics: Indian taxation, GST, TDS, ITR filing, accounting, audit, and compliance.",
        "If a question is outside CA scope, respond exactly with:",
        OUT_OF_SCOPE_REPLY,
        "Keep valid answers concise and practical.",
        `User question: ${prompt}`
    ].join("\n");

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const result = await model.generateContent(guardedPrompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            const shouldRetry = isRetryableError(error) && attempt < MAX_RETRIES;
            if (!shouldRetry) throw error;

            const backoffMs = 400 * Math.pow(2, attempt);
            await sleep(backoffMs);
        }
    }
}

export const handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        // Read the API Key from Netlify Environment Variables
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: "Server Error: API Key Missing" }) };
        }

        // Initialize Gemini client
        const genAI = new GoogleGenerativeAI(apiKey);

        // Parse user prompt
        const { prompt } = JSON.parse(event.body);
        if (!prompt || typeof prompt !== "string") {
            return { statusCode: 400, body: JSON.stringify({ error: "Prompt is required" }) };
        }

        if (!isCaScopeQuestion(prompt)) {
            return {
                statusCode: 200,
                body: JSON.stringify({ reply: OUT_OF_SCOPE_REPLY })
            };
        }

        // Generate content with temporary error retry.
        const text = await generateWithRetry(genAI, prompt);

        return {
            statusCode: 200,
            body: JSON.stringify({ reply: text })
        };
    } catch (error) {
        console.error(error);
        const isTemporary = isRetryableError(error);
        return {
            statusCode: isTemporary ? 503 : 500,
            body: JSON.stringify({
                error: isTemporary
                    ? "The AI service is temporarily busy. Please try again in a moment."
                    : error.message
            })
        };
    }
};