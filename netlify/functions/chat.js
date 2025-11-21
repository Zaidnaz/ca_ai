import { GoogleGenerativeAI } from "@google/generative-ai";

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

        // Initialize Gemini 2.5 Flash
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Parse user prompt
        const { prompt } = JSON.parse(event.body);

        // Generate content
        const result = await model.generateContent(`You are a Chartered Accountant. Answer this concisely: ${prompt}`);
        const response = await result.response;
        const text = response.text();

        return {
            statusCode: 200,
            body: JSON.stringify({ reply: text })
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};