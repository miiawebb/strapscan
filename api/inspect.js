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

Evaluate based on tag clarity, abrasion, cuts, fraying, stitching, chemical damage, or any visible defect that could compromise safe use. Consider the following user context:
"${notes}"

Your response must begin with one of the following lines:
→ PASS – suitable for continued use  
→ FAIL – should be removed from service

Then provide a brief technical justification in the next sentence.

Use this exact structure and phrasing. Do not reword or paraphrase the PASS/FAIL lines.  
Avoid mentioning any standards, regulations, or issuing authorities.
Use professional, factual, inspection-style language only — no casual tone or explanations.
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
