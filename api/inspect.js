import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { imageBase64, material, width, inspectionType } = await req.json();

    if (!imageBase64 || !inspectionType) {
      return new Response("Missing required fields", { status: 400 });
    }

    let prompt = "";

    if (inspectionType === "tag") {
      // ===== ID TAG COMPLIANCE PROMPT =====
      prompt = `
You are a certified cargo control compliance specialist. 
Inspect the uploaded ID tag of a synthetic web tie-down strap.
Assess its compliance with WSTDA, U.S., and Canadian regulations.

Required Checks:
- Manufacturer Name: Must be clear and complete.
- Working Load Limit (WLL): Must appear in both pounds (lbs) and kilograms (kg).
- Tag Legibility: No missing, faded, or smudged critical information.

Regulations:
- USA: If tag is missing/unreadable, assign default WLL = 1,000 lbs per inch of webbing width.
- Canada: Missing or unreadable tag = REMOVE FROM SERVICE.

Output Format (strictly):
Tag Status: Legible / Unreadable
Manufacturer: [Name or "Not found"]
WLL: [Value in lbs / kg or "Not listed"]
US Compliance: ✅ / ❌
Canada Compliance: ✅ / ❌

Respond precisely in this format.
      `;
    } else if (inspectionType === "quick") {
      // ===== QUICK VISUAL DAMAGE SCAN PROMPT =====
      prompt = `
You are a certified tie-down strap inspector. 
Analyze the uploaded image of a ${width} wide ${material} strap. 
Your evaluation must comply with WSTDA safety standards.

Damage Categories:
1. Webbing Integrity
   - Cuts or Tears > 1/4 inch = FAIL
   - Fraying > 2 inches = FAIL
   - Burns altering weave = FAIL

2. Structural Issues
   - Crushed fibers > 1 inch = WARNING
   - Permanent knots = FAIL
   - Broken stitching > 10% = FAIL

3. Contaminants & UV Wear
   - Chemical stains or burns altering color = WARNING
   - UV fading obscuring 25%+ = WARNING

Line Marker Detection (for MBS rating):
- Single center line = 5,000 lb/inch MBS (WSTDA compliant ✅)
- Double center lines = 6,000 lb/inch MBS (WSTDA compliant ✅)
- No visible lines = Flag as POTENTIAL non-compliance with WSTDA T-4 unless inside enclosed vehicle.

Final Decision Rules:
- PASS – No major defects.
- WARNING – Minor wear, suggest monitoring.
- FAIL – Significant damage, remove from service immediately.

Multiple Images:
- Base decision on worst damage observed.

Respond in EXACTLY this format:

Condition: PASS / WARNING / FAIL
Detected Damage: [List of issues found, or "None"]
Line Marker Result: [One line, Two lines, None]
Recommendation: Continue use / Monitor closely / Remove from service
      `;
    } else {
      return new Response("Invalid inspection type", { status: 400 });
    }

    // ===== CALL GPT-4 Turbo =====
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You are an expert strap inspector and compliance checker. Follow the user's instructions precisely.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image",
              image: {
                base64: imageBase64.split(",")[1], // Remove data prefix if it exists
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
    });

    const rawText = response.choices[0]?.message?.content || "No result";

    return new Response(JSON.stringify({ result: rawText }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Inspection API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
