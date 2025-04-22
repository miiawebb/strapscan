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

    // ✅ Inspection Type: TAG
    if (inspectionType === "tag") {
      prompt = `
You are a synthetic webbing safety inspector analyzing a photo of a strap’s product tag or label.

Your task:
- Check if a tag or label is present in the image.
- If yes, say whether it is fully legible, partially readable, or unreadable.
- If no tag is visible, state that clearly.

Only report info visible on the tag, such as:
- Manufacturer name
- Working Load Limit (WLL)
- Date of manufacture
- Serial number
- Material type or rating

DO NOT GUESS. Only describe what's clearly seen.

Your result must begin with:
→ PASS – Tag present and legible
or
→ FAIL – Tag missing or unreadable

Then include a short technical reason why.
      `.trim();
    }

    // ✅ Inspection Type: DAMAGE (default)
    else {
      prompt = `
You are a synthetic webbing safety inspector reviewing a user-submitted ${material} ${productType} used in ${region}.

Your task is to determine whether this item should be removed from service based on visual condition alone.

Inspect for these specific damage types only:

1. Abrasion – Fuzzy, matted, dulled, or worn weave.
2. Cuts/Tears – Jagged or clean fiber breaks, frayed threads.
3. Burns/Melting – Glossy, blackened, or fused areas.
4. UV Degradation – Fading, chalkiness, brittle feel.
5. Edge Fraying – Unraveled or ragged strap edges.
6. Snags – Raised loops or snag marks.
7. Embedded Material – Bulges or foreign objects inside weave.
8. Chemical/Heat Discoloration – Unnatural stains (yellow/green/brown), sticky or brittle spots.
9. Crushed Webbing – Flattened, hard, or distorted texture.
10. Broken Stitching – Loose, missing, or pulled stitching.
11. Knots – Any visible knot or twisted section.

Your response must begin with:
→ PASS – suitable for continued use
or
→ FAIL – should be removed from service

Then provide a 1-sentence professional justification.

Only include:
Detected Damage: [type1, type2, ...]
…if specific types above are clearly visible. DO NOT GUESS.

If no damage matches visually, do not include that line.
      `.trim();
    }

    console.log("🧠 AI Prompt:", prompt); // ✅ DEBUG: shows prompt in terminal

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
                detail: "low" // prevents image overload, keeps latency low
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
