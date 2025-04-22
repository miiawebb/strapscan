// /api/inspect.js

import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req) {
  try {
    const { imageBase64, material, productType, label } = await req.json();

    let prompt = "";

    if (label === "ID Tag") {
      prompt = `
You are Agent 1 – Tag Verification Specialist.
Evaluate ID tags on synthetic tie-down products.

Confirm:
- Tag is present and securely attached
- Tag is fully legible
- Tag shows: manufacturer name/logo, WLL, and manufacture date/traceability

Respond only:
→ PASS – Tag present and legible
→ FAIL – Tag missing or unreadable

Give a short, professional reason. Don't guess. If not clearly readable, fail it.
      `.trim();
    } else {
      prompt = `
You are Agent 2 – Webbing Damage Assessment Specialist.
Check for:
- Abrasion, cuts, burns, fraying, chemical/UV damage, stitching, embedded material, knots

Result must start:
→ PASS – suitable for continued use
→ FAIL – should be removed from service

If damage is clear, add:
Detected Damage: [type1, type2]

Don't guess. Only list visible damage.
      `.trim();
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content: "You are a visual inspection assistant for industrial strap safety evaluations.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageBase64, detail: "high" } },
          ],
        },
      ],
    });

    const result = response.choices[0]?.message?.content || "No result returned.";
    return NextResponse.json({ result });

  } catch (error) {
    const msg =
      error?.response?.data?.error?.message ||
      error?.message ||
      "Unknown error from OpenAI";

    console.error("OpenAI Error:", msg);
    return NextResponse.json({ result: `OpenAI failed: ${msg}` }, { status: 500 });
  }
}
