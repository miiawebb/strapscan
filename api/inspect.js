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

    const base64Cleaned = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    let prompt = "";

    if (inspectionType === "tag") {
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

Image (base64 encoded):
${base64Cleaned}

Respond ONLY in this format:
Tag Status: Legible / Unreadable
Manufacturer: [Name or "Not found"]
WLL: [Value in lbs / kg or "Not listed"]
US Compliance: ✅ / ❌
Canada Compliance: ✅ / ❌
      `;
    } else if (inspectionType === "quick") {
      prompt = `
You are a certified tie-down strap inspector. 
Analyze this strap image (${width}, ${material}) using WSTDA safety standards.

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

Line Marker Detection:
- One line = 5,000 lb/in MBS ✅
- Two lines = 6,000 lb/in MBS ✅
- No line = ⚠️ unless in enclosed cargo

Base64 Image:
${base64Cleaned}

Respond strictly:
Condition: PASS / WARNING / FAIL
Detected Damage: [list or "None"]
Line Marker Result: One line / Two lines / None
Recommendation: Continue use / Monitor closely / Remove from service
      `;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: "You are an expert strap inspector. Follow compliance rules exactly.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const resultText = response.choices[0]?.message?.content || "No result";

    return new Response(JSON.stringify({ result: resultText }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Inspection API error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
