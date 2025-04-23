// /api/inspect.js

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { generateInspectionPrompt } from "./generatePrompt"; // Your existing logic

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req) {
  try {
    const { imageBase64, material, productType, imageType, region } = await req.json();

    if (!imageBase64 || !material || !productType || !imageType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const prompt = await generateInspectionPrompt({ imageType, material, productType, region });

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are a strict safety and compliance AI. Respond in clear inspection format only.`
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageBase64 } }
          ]
        }
      ],
      temperature: 0.4,
      max_tokens: 600
    });

    const result = response.choices[0]?.message?.content || "No result.";
    return NextResponse.json({ result });

  } catch (err) {
    console.error("AI inspection failed:", err);
    return NextResponse.json({ error: "AI inspection error" }, { status: 500 });
  }
}
