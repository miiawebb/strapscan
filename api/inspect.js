import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageBase64, material, productType } = req.body;

  if (!imageBase64 || !material || !productType) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const isTagCheck = req.url.includes("idTag=true");
  const isDamageCheck = req.url.includes("damage=true");

  const tagPrompt = `
Agent 1 – ID Tag Compliance Evaluation

Instruction:
You are a certified cargo control compliance specialist tasked with evaluating the identification tags on synthetic tie-down products, including ratchet straps, winch straps, and logistic straps.

Your responsibilities:
- Determine if an ID tag is:
  • Present and securely attached
  • Legible (clear enough to read critical markings)
  • Containing key data: Manufacturer name or logo, Working Load Limit (WLL), Date of Manufacture, Serial Number, Material/Ratings

⚠️ Critical note on compliance:
If the tag is missing or unreadable, you must NOT fail the strap outright.

In the United States: Refer to FMCSA/DOT/WSTDA regulations. If the tag is unreadable or absent, note that the Working Load Limit defaults to 1,000 lb per inch of strap width. Example: 2-inch strap = 2,000 lb WLL.

In Canada: Under CVSA/National Safety Code (NSC) standards, a missing or unreadable ID tag results in mandatory removal from service.

✅ Do NOT use PASS/FAIL.
✅ Instead, describe the tag's condition and display both region-specific results.

Example output:

Tag is visible and legible. Manufacturer: ACME Corp. WLL: 3,335 lb. Serial No: 298374-AZ.

✅ U.S. – Fully compliant  
❌ Canada – Remove from service if tag becomes unreadable.

Only describe what's clearly visible. Do not guess. If nothing can be confirmed, state that plainly.
`;

  const damagePrompt = `
Agent 2 – Webbing Damage Analysis

Instruction:
You are a certified visual inspection specialist assessing the safety condition of synthetic webbing used in tie-down straps.

Analyze the image and determine if the strap shows any of the following types of physical damage:

1. Abrasion – fuzzy, dulled, or matted weave
2. Cuts/Tears – frayed, split, or severed fibers
3. Burns/Melting – glossy, blackened, or fused areas
4. UV Degradation – faded, chalky, brittle
5. Edge Fraying – unraveling, ragged sides
6. Snags – loops, raised threads
7. Embedded Material – trapped objects inside
8. Chemical Discoloration – yellow/green stains, sticky zones
9. Crushed Webbing – flat, compressed texture
10. Broken Stitching – missing or pulled threads
11. Knots – twisted, tied, or compressed areas

⚠️ DO NOT mark for surface dirt, oil, grease, or minor discoloration unless structural damage is confirmed.

Cut + Defect Rules:
- Opposite edge cuts = additive
- Across width = additive
- Same edge = use deepest only

Strap removal thresholds:
• 4-inch = damage > ¾ in  
• 3-inch = damage > ⅝ in  
• 2-inch or 1.75-inch = damage > ⅜ in

✅ Response format:
→ PASS – Suitable for continued use  
→ FAIL – Should be removed from service

Justification (1–2 lines).  
Only include:
Detected Damage: [type1, type2, …]
…if visible. Do NOT guess.
`;

  try {
    const imageBuffer = Buffer.from(imageBase64.split(",")[1], "base64");

    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      max_tokens: 1000,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: isTagCheck ? tagPrompt : damagePrompt
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64.split(",")[1]}`
              }
            }
          ]
        }
      ]
    });

    const responseText = visionResponse.choices[0].message.content.trim();
    res.status(200).json({ result: responseText });

  } catch (error) {
    console.error("AI inspection error:", error);
    res.status(500).json({ error: "AI inspection failed" });
  }
}
