import { GoogleGenerativeAI } from "@google/generative-ai";

export const handler = async (event) => {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    try {
        // This securely grabs the Key Pair you set in Netlify Dashboard
        const apiKey = process.env.GEMINI_API_KEY; 
        if (!apiKey) return { statusCode: 500, body: JSON.stringify({ reply: "API Key missing on server." }) };

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Using stable flash endpoint

        const { text } = JSON.parse(event.body);
        
        const result = await model.generateContent(`Act as a Chartered Accountant. Concise answer: ${text}`);
        const response = await result.response;
        
        return {
            statusCode: 200,
            body: JSON.stringify({ reply: response.text() })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ reply: "Error: " + error.message }) };
    }
};