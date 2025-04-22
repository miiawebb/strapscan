import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const config = {
  api: { bodyParser: true }
};

export default async function handler(req, res) {
  try {
    const { imageBase64, material, productType, region, notes } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ result: "Missing image data." });
    }

const prompt = `
You are a synthetic webbing safety inspector reviewing a user-submitted ${material} ${productType}, used in the ${region}. Your role is to decide if this item should be removed from service based solely on visible condition and tag compliance.

Before analyzing the image, visually reference these training examples:
- ✅ PASS examples: https://imgur.com/a/qBKAnbq
- ❌ FAIL examples: https://imgur.com/a/AzCKcuX

Evaluate the image for the following potential damage types:

1. **Abrasion** – Fuzzy, matted, or worn patches; dulled or flattened weave.
2. **Cuts/Tears** – Straight or jagged breaks, frayed or severed threads.
3. **Burns/Melting** – Blackened, glossy, or fused spots; hard or warped fibers.
4. **UV Degradation** – Faded, brittle, or chalky texture; discoloration.
5. **Edge Fraying** – Ragged, notched, or unraveled edges.
6. **Snags** – Loops, raised threads, or thin spots caused by snagging.
7. **Embedded Material** – Bulges, indentations, or foreign objects embedded in the fibers.
8. **Chemical or Heat Discoloration** – Yellow/green/brown stains, sticky or brittle spots.
9. **Crushed Webbing** – Flattened or hardened areas; distorted weave.
10. **Broken or Loose Stitching** – Gaps or missing stitches, especially in critical load areas.
11. **Knots** – Any tied or bunched section distorting the strap.

Also consider this user context:
"${notes}"

Your response must always begin with:
→ PASS – suitable for continued use  
or  
→ FAIL – should be removed from service

Then give a brief technical justification (one sentence).

Then, if you are confident, include this additional line:
Detected Damage: [list of specific types, e.g., Abrasion, UV Degradation]

If you are not confident, do not guess — omit the line.

Use only professional, inspection-style language. Do not mention any standards, certifications, or issuing authorities.
Do not reword or paraphrase the PASS/FAIL lines.
`;

    const result = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: imageBase64 }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    const answer = result.choices[0].message.content;
    res.status(200).json({ result: answer });
  } catch (err) {
    console.error("OpenAI Error:", err);
    res.status(500).json({ result: `OpenAI failed: ${err.name} – ${err.message}` });
  }
}
