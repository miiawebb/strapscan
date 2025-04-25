
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const standardResponses = {
  "abrasion": "Excessive abrasive wear has reduced the effective strength of the strap. Remove from service.",
  "cut": "Cuts or slices significantly diminish the strap’s load capacity. Remove from service.",
  "fraying": "Frayed edges or loose fibers detected. If exceeding 2 inches, remove from service.",
  "burn": "Heat damage such as charring or melting is visible. Remove from service.",
  "stitching": "Broken or worn stitching found in load-bearing areas. Strap must be retired.",
  "knot": "Knots concentrate stress and reduce effective strength. Remove from service.",
  "chemical": "Chemical exposure observed. May degrade material strength. Remove from service.",
  "uv": "UV fading or discoloration suggests degradation. Remove from service if severe.",
  "snag": "Snags found. Minor issues may warrant monitoring; severe snags require removal.",
  "marker-none": "No marker lines detected. May violate WSTDA-T-4 2.3.7 unless used in enclosed vehicles.",
  "marker-single": "Single line marker found. Interpreted as 5,000 lb/inch MBS. Complies with WSTDA-T-4.",
  "marker-double": "Double line marker found. Interpreted as 6,000 lb/inch MBS. Complies with WSTDA-T-4."
};

const quickScanPrompt = ({ width, material }) => `
You are a certified tie-down strap inspector. Review the uploaded image of a ${width}-wide ${material} strap. Your assessment must align with WSTDA inspection standards.

Evaluate the strap for:
1. Webbing Integrity:
- Cuts, Tears, Fraying, Burns
2. Structural Issues:
- Crushed fibers, Knots, Stitching damage
3. Contaminants:
- Chemical burns, Oil, Grease
4. Discoloration:
- UV fading, General surface wear
5. Marker Lines:
- Identify if line markers are present (none / single / double)

Output Format:
→ [PASS | WARNING | FAIL] – Condition summary.
Detected Damage: [List each damage type].
Marker Lines: [none | 1 line | 2 lines]
Recommendation: [Action to be taken]
`;

const tagScanPrompt = `
You are a certified cargo control compliance specialist. Your task is to inspect the ID tag on a synthetic web tie-down strap.

Check:
- Manufacturer Name: Must be legible and complete.
- Working Load Limit (WLL): Must appear in lbs and kg.

Rules:
- If tag is unreadable → US: defaults to 1,000 lbs/inch; CA: non-compliant.
- If WLL is missing, strap must be removed from service.
- If manufacturer name is missing, strap must be removed.

Output Format:
→ [PASS | WARNING | FAIL] – Label condition.
Details:
- Manufacturer: [name or not found]
- WLL: [value or not visible]
- Compliance: US [✓ or ✗], CA [✓ or ✗]
`;

export default async function handler(req, res) {
  try {
    const { imageBase64, inspectionType, width, material } = req.body;

    if (!imageBase64 || !inspectionType) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const prompt = inspectionType === "quick"
      ? quickScanPrompt({ width, material })
      : tagScanPrompt;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are a safety-critical inspection tool. Output must be factual and aligned with WSTDA compliance. Use standardized phrasing for consistent results."
        },
        {
          role: "user",
          content: `Image uploaded:

${imageBase64}

${prompt}`
        }
      ],
      max_tokens: 1000
    });

    const resultText = completion.choices[0].message.content;

    res.status(200).json({ result: resultText });
  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ error: "Inspection failed." });
  }
}
