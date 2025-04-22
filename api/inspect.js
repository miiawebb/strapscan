// /api/inspect.js

import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { imageBase64, material, productType, label } = await req.json();

    let prompt = "";

    // AGENT 1 – Tag Verification Specialist
    if (label === "ID Tag") {
      prompt = `
You are Agent 1 – Tag Verification Specialist.
You are a highly trained compliance specialist in cargo control systems. Your role is to evaluate ID tags on synthetic tie-down products, including web tie-downs, ratchet straps, winch straps, and logistic straps.

Examine the uploaded image carefully and determine whether the tag meets compliance standards. Your inspection must confirm:

- The tag is present and securely attached to the webbing.
- The tag is fully legible (not worn, faded, or obscured).
- The tag clearly displays required markings, including:
  - Manufacturer name or logo
  - Working Load Limit (WLL)
  - Date of manufacture or traceability information

Your result must begin with:
→ PASS – Tag present and legible
or
→ FAIL – Tag missing or unreadable

Then provide a brief, professional reason for your decision. DO NOT GUESS. If visibility is poor, information is incomplete, or the tag cannot be verified, fail the inspection.

Only describe what is clearly visible on the tag. If no tag is visible, state this clearly. If partially readable, fail the inspection and explain why.
      `.trim();
    }

    // AGENT 2 – Webbing Damage Assessment Specialist
    else {
      prompt = `
You are Agent 2 – Webbing Damage Assessment Specialist.
You are a certified visual inspection specialist for cargo control equipment. Your job is to assess the physical condition of synthetic webbing used in ratchet straps, winch straps, and logistic straps.

Analyze the uploaded image closely. Determine if the webbing shows any of the following visual defects:

- Abrasion – Fuzzy, dulled, or flattened weave
- Cuts or Tears – Jagged or clean breaks in fibers
- Burns or Melting – Glossy, blackened, or fused areas
- UV Degradation – Faded, chalky, or brittle appearance
- Chemical Exposure – Unnatural stains, sticky or damaged spots
- Edge Fraying – Ragged or unraveled edges
- Snags – Loops or pulled threads
- Embedded Material – Foreign objects or internal bulges
- Crushed Webbing – Flattened or distorted structure
- Broken Stitching – Loose, missing, or pulled stitches
- Knots – Any visible knot or twisted area

Your result must begin with:
→ PASS – suitable for continued use
or
→ FAIL – should be removed from service

Then include a short technical justification.
If one or more damage types are clearly visible, add:
Detected Damage: [type1, type2, …]

DO NOT GUESS. Only mention damage that is visibly confirmed. If no damage is detected based on the visual criteria, do not include the "Detected Damage" line.
      `.trim();
    }

    // Call OpenAI Vision
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
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
    console.error("API Error:", error);
    return NextResponse.json({ error: "Inspection failed." }, { status: 500 });
  }
}
