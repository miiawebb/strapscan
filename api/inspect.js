// /api/inspect.js – full GPT-4 Turbo endpoint with dual mode logic

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageBase64, material, productType } = req.body;
    const isTag = !!req.query.idTag;
    const isDamage = !!req.query.damage;
    const region = "US"; // optional future enhancement: detect or let user choose
    const webbingWidth = req.body.webbingWidth || "2 inch";

    if (!imageBase64 || !material || !productType) {
      return res.status(400).json({ error: "Missing input fields" });
    }

    const prompt = await generateInspectionPrompt({
      imageType: isTag ? "tag" : "damage",
      material,
      productType,
      region,
      webbingWidth
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are a highly trained synthetic webbing inspector."
        },
        {
          role: "user",
          content: `Here is the image to inspect: ${imageBase64}\n\n${prompt}`
        }
      ],
      temperature: 0.4
    });

    const result = response.choices?.[0]?.message?.content || "No response from AI model.";
    res.status(200).json({ result });

  } catch (err) {
    console.error("Inspection error:", err);
    res.status(500).json({ error: "A server error occurred during inspection." });
  }
}

// Prompt logic is imported below or pasted inline if needed
async function generateInspectionPrompt({ imageType, material, productType, region, webbingWidth }) {
  if (imageType === "tag") {
    return `
Agent 1: ID Tag Compliance Evaluation

Instruction:
You are a certified cargo control compliance specialist. Your task is to evaluate the ID tag on a synthetic web tie-down (such as a ratchet strap, winch strap, or logistic strap) based strictly on WSTDA and regional safety standards.

Required tag data (per WSTDA Section 2.8.1):
1. Manufacturer name or trademark
2. Working Load Limit (WLL) in both pounds (lbs) and kilograms (kg)

Region-based compliance:

- United States:
  If the ID tag is missing or unreadable, the strap may still be used by applying a default Working Load Limit (WLL) of 1,000 lb per inch of webbing width.
  (e.g., 2-inch strap = 2,000 lb WLL)

- Canada:
  The tag must be present and legible. If missing or unreadable, the strap must be removed from service.

Do NOT use PASS or FAIL.
Instead, clearly describe what is visible on the tag and report U.S. and Canadian compliance separately.

Example Output:

Tag is visible and legible. Manufacturer: SlingCo. WLL: 5,000 lbs / 2,268 kg.  
US: Compliant  
Canada: Compliant

Tag is visible but missing WLL in kilograms.  
US: Compliant – defaults to 1,000 lb per inch WLL  
Canada: Non-compliant

Tag is unreadable or missing.  
US: Compliant with default WLL = 1,000 lb per inch of webbing  
Canada: Non-compliant
    `.trim();
  }

  return `
Agent 2: Webbing Damage Assessment Specialist

Instruction:
You are a certified visual inspection specialist for synthetic tie-downs, such as ratchet straps, winch straps, and logistic straps. Your job is to determine if the webbing should remain in service or be removed based on visible safety-critical defects.

Inspect the image for the following damage types:
- Abrasion – fuzzy, worn, dulled, or flattened weave
- Cuts or Tears – jagged or straight fiber breaks, frayed edges
- Burns or Melting – glossy, blackened, fused, or hardened areas
- UV Degradation – faded, chalky, brittle texture
- Edge Fraying – unraveling, notched, or thinned strap edges
- Snags – raised loops or pulled threads
- Embedded Material – foreign debris causing bulges or irregularities
- Chemical/Heat Discoloration – unnatural stains, sticky/brittle spots
- Crushed Webbing – flattened or compressed appearance
- Broken Stitching – loose, missing, or pulled stitches
- Knots – any tied, bunched, or twisted webbing areas

Important:
Do not flag cosmetic surface dirt, oil, or minor discoloration as damage unless structural fibers are compromised. Only confirm what is clearly visible.

Defect Thresholds (WSTDA Guidelines):
Strap must be removed from service if a single or cumulative cut/tear exceeds:

- 1-inch strap → > ⅜ inch  
- 2-inch strap → > ⅜ inch  
- 3-inch strap → > ⅝ inch  
- 4-inch strap → > ¾ inch  

Edge Rule:
- Multiple defects on the same edge = use only the deepest one.  
- Defects on opposite edges or across the web = add them together.

Output Format:
→ PASS – Suitable for continued use  
→ FAIL – Should be removed from service  
→ WARNING – Signs of early wear or deterioration; recommend full manual inspection

Follow with a concise professional justification.

If damage is clearly visible, include:
Detected Damage: [abrasion, broken stitching]

Only list confirmed damage types. Do not guess or assume.
  `.trim();
}
