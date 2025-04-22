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
      inspectionType // ✅ new field from dropdown
    } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ result: "Missing image data." });
    }

    let prompt = "";

    // ✅ Use the correct prompt based on inspection type
    if (inspectionType === "tag") {
      prompt = `
You are a synthetic webbing safety inspector analyzing a photo of a strap’s product tag or label. Your job is to visually determine if the tag is present and readable.

Tag Evaluation Instructions:
- If a stitched or printed label is visible, determine if it is fully legible, partially readable, or too faded/torn.
- If no tag is visible in the image, state this clearly.

If any of the following data is readable, include it in the result:
- Manufacturer or brand name  
- Date of manufacture or expiration  
- Working Load Limit (WLL)  
- Serial number  
- Material or model ID

Do not guess or infer any data.
Only report what is clearly visible on the tag itself.

Your response must begin with:
→ PASS – Tag present and legible  
or  
→ FAIL – Tag missing or unreadable

Then explain briefly what you see.
      `.trim();
    } else {
      prompt = `
You are a synthetic webbing safety inspector reviewing a user-submitted ${material} ${productType}, used in the ${region}. Your role is to determine if this item should be removed from service based solely on visible condition and tag compliance.

Before analyzing the image, refer to these known training examples:
- ✅ PASS: https://imgur.com/a/qBKAnbq
- ❌ FAIL: https://imgur.com/a/AzCKcuX

Use the official criteria below. Only these definitions are valid — do not improvise, guess, or assume damage based on color, texture, contrast, or shadow alone.

---

VISUAL DEFINITIONS: DAMAGE TYPES

1. **Abrasion** – Fuzzy, matted, or worn patches; dulled or flattened weave.
2. **Cuts/Tears** – Straight or jagged breaks, frayed or severed threads.
3. **Burns/Melting** – Blackened, glossy, or fused spots; hard or warped fibers.
4. **UV Degradation** – Faded, brittle, or chalky texture; discoloration.
5. **Edge Fraying** – Ragged, notched, or unraveled edges.
6. **Snags** – Loops, raised threads, or thin spots caused by snagging.
7. **Embedded Material** – Bulges, indentations, or visible foreign objects embedded in the fibers.
8. **Chemical or Heat Discoloration** – Yellow, green, or brown stains; sticky or brittle texture.
9. **Crushed Webbing** – Flattened or hardened areas; distorted weave pattern.
10. **Broken or Loose Stitching** – Gaps, missing or hanging stitches, especially at structural points.
11. **Knots** – Any tied or bunched section distorting the strap.

---

Your response must ALWAYS start with one of the following two lines:

→ PASS – suitable for continued use  
→ FAIL – should be removed from service

Then give a **1-sentence justification** using technical inspection language only.

---

❗ Detected Damage Line – RULES:

Only include this line if you are confident based on clear, visual match to one or more of the definitions above:

Detected Damage: [e.g., Cuts/Tears, Burns/Melting]

Never list damage types unless the features visibly match the definitions.  
Never list “Embedded Material” unless an actual object is visible.  
Never list “Cuts” unless clean separation or severed threads are visible.  
Do not infer or assume damage based on color, dirt, smudges, wear, or shadow.

If no valid damage types match, do not include the line at all.
Do not say “None” or “No visible damage” — just omit the line.

Use professional, inspection-style language only.
Do not reference any standards, certifications, or authorities.
Do not paraphrase or reword the PASS/FAIL decision lines.
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
