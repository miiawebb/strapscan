import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req) {
  try {
    const { imageBase64, inspectionType, width, material } = await req.json();

    if (!imageBase64 || !inspectionType) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Base prompt config
    let prompt;
    let systemRole;
    let userInstructions;

    // Damage Response Map (standardized messages)
    const damageResponses = {
      "Cuts or Tears": "The strap has a significant cut or tear that exceeds 1/4 inch, which is a critical failure condition according to the WSTDA standards. Remove from service.",
      "Fraying": "The webbing shows fraying over 2 inches in length, compromising structural integrity. Remove from service.",
      "Burn Marks": "Melted or heat-damaged areas have been detected, which weakens the strap. Remove from service.",
      "Crushed Fibers": "Sections of the webbing are crushed or deformed, indicating potential compression damage. Remove from service.",
      "Knots": "A knot was found in a load-bearing area, concentrating stress and reducing strength. Remove from service.",
      "Broken Stitching": "Critical stitching is broken or missing in load-bearing areas. Remove from service.",
      "Chemical Stains": "Visible chemical damage detected. Acid or caustic exposure degrades fibers. Remove from service.",
      "Grease or Contaminants": "Contaminants are present which may affect fiber performance. Further inspection advised.",
      "UV Damage": "The strap shows signs of bleaching or fading consistent with UV degradation. Monitor for further wear.",
      "Multiple Defects": "Multiple failure indicators detected. Immediate removal from service is advised."
    };

    // TagScan setup
    if (inspectionType === "tag") {
      systemRole = "You are a certified cargo control compliance specialist.";
      userInstructions = `
You are tasked with inspecting the ID tag on a synthetic tie-down strap for compliance with WSTDA, U.S., and Canadian regulations.

Required Fields:
- Manufacturer Name: Must be clear and complete.
- Working Load Limit (WLL): Must appear in both pounds (lbs) and kilograms (kg).

Inspection Criteria:
- Tag must be legible, undamaged, and display all required fields.
- WSTDA / US: If tag is unreadable or missing → use 1,000 lb per inch of width as default.
- Canada: If tag is missing or unreadable → REMOVE from service immediately.

Output Format:
Tag Status: Legible / Unreadable
Manufacturer: [Name or “Not found”]
WLL: [Value or “Not listed”]
US Compliance: ✅ / ❌
Canada Compliance: ✅ / ❌
Decision: PASS / FAIL with brief reason
      `.trim();
    }

    // QuickScan setup
    if (inspectionType === "quick") {
      systemRole = "You are a certified tie-down strap inspector.";
      userInstructions = `
You are reviewing an uploaded image of a ${width}-wide ${material} strap. Your task is to detect signs of visual damage and assess compliance with WSTDA guidelines.

Step 1: Detect all visible damage. Classify using ONLY the following:
- Cuts or Tears > 1/4 inch
- Fraying > 2 inches
- Burn Marks or Heat Damage
- Crushed Fibers
- Knots
- Broken Stitching
- Chemical Stains or Burns
- Oil, Grease, or Other Contaminants
- UV Damage
- Multiple Defects

Step 2: Evaluate visual line markers:
- Single Line: MBS 5,000 lb/in (WSTDA T-4 2.3.7)
- Double Line: MBS 6,000 lb/in (WSTDA T-4 2.3.7)
- No Line: Potential non-compliance unless used in enclosed cargo

Step 3: Return final result in this format:
Condition: PASS / WARNING / FAIL
Damage: [List only if applicable]
Recommendation: [From mapped standard response]
Line Marker Result: [If PASS or WARNING only]
      `.trim();
    }

    // Compose OpenAI message
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      temperature: 0.3,
      max_tokens: 1200,
      messages: [
        { role: "system", content: systemRole },
        {
          role: "user",
          content: [
            { type: "text", content: userInstructions },
            {
              type: "image_url",
              image_url: {
                url: imageBase64,
                detail: "high"
              }
            }
          ]
        }
      ]
    });

    const response = completion.choices[0].message.content;

    // Extract summary fields for front-end
    const resultMatch = response.match(/Condition:\s*(PASS|WARNING|FAIL)/i);
    const result = resultMatch ? `→ ${resultMatch[1].toUpperCase()}` : "→ UNKNOWN";

    const formatted = `
Inspection Results
${response}
    `.trim();

    return Response.json({ result, fullReport: formatted });
  } catch (err) {
    console.error("Inspection error:", err);
    return new Response("Error processing inspection", { status: 500 });
  }
}
