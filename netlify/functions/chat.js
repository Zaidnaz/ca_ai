import { GoogleGenerativeAI } from "@google/generative-ai";

const MODELS = ["gemini-2.5-flash", "gemini-1.5-flash"];
const MAX_RETRIES = 2;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error) {
    const message = String(error?.message || "").toLowerCase();
    return message.includes("503") || message.includes("service unavailable") || message.includes("high demand");
}

async function generateWithFallback(genAI, prompt) {
    let lastError;

    for (const modelName of MODELS) {
        const model = genAI.getGenerativeModel({ model: modelName });

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const result = await model.generateContent(`You are a Chartered Accountant. Answer this concisely: ${prompt}`);
                const response = await result.response;
                return response.text();
            } catch (error) {
                lastError = error;
                const shouldRetry = isRetryableError(error) && attempt < MAX_RETRIES;
                if (!shouldRetry) break;

                const backoffMs = 400 * Math.pow(2, attempt);
                await sleep(backoffMs);
            }
        }
    }

    throw lastError;
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

        // Generate content with model fallback + temporary error retry.
        const text = await generateWithFallback(genAI, prompt);

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