// inspect.js — Basic OpenAI GPT-4 Turbo integration with placeholder logic
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageBase64, material, productType } = req.body;

    if (!imageBase64 || !material || !productType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are an AI that returns a simple placeholder result for testing."
        },
        {
          role: "user",
          content: `The user uploaded an image of a ${material} ${productType}. Please give a placeholder inspection result.`
        }
      ],
      max_tokens: 300
    });

    const resultText = chatResponse.choices[0]?.message?.content || "No response generated.";
    return res.status(200).json({ result: resultText });

  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "AI inspection failed." });
  }
}
