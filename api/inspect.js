import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      imageBase64,
      inspectionType,
      width,
      material
    } = body;

    if (!imageBase64 || !inspectionType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields." }),
        { status: 400 }
      );
    }

    let prompt = "";
    if (inspectionType === "tag") {
      prompt = `
You are a certified cargo control compliance specialist. Your task is to inspect the ID tag on a synthetic web tie-down strap and assess its compliance with WSTDA, U.S., and Canadian regulations.

Required Fields:
- Manufacturer Name: Must be clear and complete.
- Working Load Limit (WLL): Must appear in both pounds (lbs) and kilograms (kg).

Inspection Guidelines:
1. Manufacturer Name:
   - Tag must show a full, legible manufacturer name.
2. WLL:
   - Both lb and kg units required. Must be clearly readable and match the physical rating of the strap.
3. Tag Condition:
   - Tag must be free from fading, tears, or smudging that obscures key data.

Regulations:
- USA (WSTDA): If tag is missing/unreadable, use default WLL = 1,000 lbs per inch of width.
- Canada: Missing or unreadable tag = Immediate removal from service.

Output Format:
→ PASS / WARNING / FAIL
Tag Status: Legible / Unreadable
Manufacturer: [Name or "Not found"]
WLL: [lbs / kg or "Not listed"]
US Compliance: ✅ / ❌
Canada Compliance: ✅ / ❌
      `.trim();
    } else {
      prompt = `
You are a certified tie-down strap inspector. Review the uploaded image of a ${width}-wide ${material} strap. Your assessment must align with WSTDA inspection standards.

Webbing Damage:
- Cuts or Tears > 1/4 inch = FAIL
- Fraying > 2 inches = FAIL
- Burn marks altering weave = FAIL

Structural Issues:
- Crushed fibers > 1 inch = WARNING
- Knots in webbing = FAIL
- Broken or loose stitching >10% = FAIL

Contaminants & UV Wear:
- Chemical stains altering color = WARNING
- Fading obscuring >25% = WARNING or FAIL

Marker Detection:
- One line = 5,000 lb/in MBS
- Two lines = 6,000 lb/in MBS
- None = Warning (unless enclosed vehicle use)

Result format:
→ PASS / WARNING / FAIL
Condition: [PASS, WARNING, or FAIL]
Damage: [summary]
Line Marker: One / Two / None
Recommendation: [What action the user should take]
      `.trim();
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert in cargo control inspection and WSTDA compliance."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    });

    const output = response.choices[0].message.content;
    return new Response(JSON.stringify({ result: output }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Inspection Error:", err);
    return new Response(
      JSON.stringify({ error: "Error processing inspection" }),
      { status: 500 }
    );
  }
}
