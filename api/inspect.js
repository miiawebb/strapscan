import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = {
  api: { bodyParser: true }
};

export default async function handler(req, res) {
  try {
    const {
      imageBase64,
      material,
      productType,
      region,
      inspectionType
    } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ result: "Missing image data." });
    }

    let prompt = "";

    if (inspectionType === "tag") {
      prompt = `
Agent 1: ID Tag Compliance Evaluation
Instruction:
You are a certified cargo control compliance specialist evaluating synthetic tie-down tags.

Responsibilities:
- Determine if an ID tag is:
  • Present and securely attached
  • Legible (critical markings readable)
  • Showing key data:
    - Manufacturer
    - WLL
    - Date of Manufacture
    - Serial Number
    - Material/Ratings

Compliance Logic:
- U.S.: If tag is unreadable or missing, assume default WLL = 1,000 lb per inch of width.
- Canada: If tag is unreadable or missing, REMOVE FROM SERVICE.

⚠️ Do NOT use "PASS" or "FAIL".

Your output must:
- Clearly describe what's visible.
- Include compliance outcome for:
  U.S.
  Canada

Example:
Tag is visible and legible. Manufacturer: ACME. WLL: 3,335 lb. Serial No: A-2034. Material: Polyester.
U.S.: Fully compliant
Canada: Fully compliant

Tag is unreadable or not present.
U.S.: Compliant with default WLL = 2,000 lb (2-inch strap)
Canada: Remove from service
`.trim();
    } else {
      prompt = `
Agent 2: Webbing Damage Assessment Specialist
You are evaluating a synthetic ${material} ${productType} used for cargo securement.

Visually inspect for:
• Abrasion – worn, fuzzy, flattened surface
• Cuts/Tears – frayed or broken fibers
• Burns – melted, glossy, blackened spots
• UV Degradation – faded, chalky, cracked areas
• Edge Fraying – ragged, unraveled edges
• Snags – loops or pulled threads
• Embedded Material – bulges or trapped debris
• Chemical/Heat Discoloration – sticky, yellow, brown, or green marks
• Crushed Webbing – compressed or hard strap segments
• Broken Stitching – missing or loose threads
• Knots – distorted, tied, bunched areas

⚠️ DO NOT flag dirt, oil, or discoloration unless structural.

Begin result with:
→ PASS – Suitable for continued use
or
→ FAIL – Should be removed from service

If any defects are present, add:
Detected Damage: [abrasion, edge fraying, etc.]

Reference these WSTDA thresholds:
• 2-inch: > 3/8"
• 3-inch: > 5/8"
• 4-inch: > 3/4"

Only report verified defects. Do not guess.
`.trim();
    }

    const result = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: imageBase64,
                detail: "low"
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    const answer = result.choices[0]?.message?.content || "No response received.";
    res.status(200).json({ result: answer });
  } catch (err) {
    console.error("OpenAI Error:", err);
    res.status(500).json({
      result: `AI inspection failed. (${err.name} – ${err.message})`
    });
  }
}
