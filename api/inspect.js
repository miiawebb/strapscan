import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageBase64, inspectionType, material, width } = req.body;

  if (!imageBase64 || !inspectionType) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    let prompt = "";

    if (inspectionType === "quick") {
      prompt = `
You are a certified tie-down strap inspector. You will be shown a high-resolution image of a synthetic web tie-down strap.

Your task:
1. Visually inspect the strap and detect any visible damage.
2. Classify the damage into one or more of the following WSTDA removal criteria:

- Holes, Tears, Cuts, Snags, or Embedded Particles
- Broken or Worn Stitching
- Excessive Abrasive Wear
- Knots
- Melting, Charring, or Weld Spatter
- Chemical Burns
- UV Degradation (bleaching, stiffness)
- Distorted, Pitted, or Corroded Hardware
- Illegible or Missing ID Tags
- Other visible damage

Return only the damage **type**, and classify the condition as:

- PASS: No visible damage
- WARNING: Minor, non-critical signs of damage
- FAIL: Significant damage that requires removal

Line Marker Logic:
- If visible: One line = 5,000 lb/in MBS; Two lines = 6,000 lb/in MBS
- If not visible: Flag as non-compliant with WSTDA T-4 Section 2.3.7 unless used in enclosed transport

Only respond in JSON using this format:

{
  "condition": "PASS" | "WARNING" | "FAIL",
  "damageType": ["Cuts", "Fraying", "UV Degradation"],
  "lineMarker": "One" | "Two" | "None",
  "status": "PASS" | "WARNING" | "FAIL"
}
`;
    } else if (inspectionType === "tag") {
      prompt = `
You are a certified cargo control compliance specialist. Inspect the ID tag shown in the image and extract the following:

1. Manufacturer Name
2. Working Load Limit (WLL) in lbs and kg
3. Tag legibility
4. Compliance:
   - US: ✅ if readable, ❌ if unreadable
   - Canada: ✅ only if tag is fully legible and shows both manufacturer and WLL

Only respond in JSON using this format:

{
  "tagStatus": "Legible" | "Unreadable",
  "manufacturer": "Vevor",
  "wll": "5400 lbs / 2449 kg",
  "us_compliance": true | false,
  "ca_compliance": true | false,
  "status": "PASS" | "FAIL"
}
`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4-1106-vision-preview",
      temperature: 0.3,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: "You will receive an image in base64 format. Analyze it strictly according to the prompt."
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
                url: imageBase64,
                detail: "high"
              }
            }
          ]
        }
      ]
    });

    const aiRaw = response.choices[0]?.message?.content;
    if (!aiRaw) throw new Error("Empty response from AI.");

    const aiJson = JSON.parse(aiRaw);

    if (inspectionType === "quick") {
      let damageSummary = "";
      let recommendation = "";
      let lineInfo = "";

      const damageMap = {
        "Cuts": "Damage Identified: Cut in the webbing\nAction: Remove the tie down from service. Cuts cause localized weakness in the webbing and can result in failure under load.",
        "Tears": "Damage Identified: Tear in the webbing\nAction: Remove the tie down from service. A tear in the webbing is a critical failure point, weakening the tie down's integrity.",
        "Snags": "Damage Identified: Snag in the webbing\nAction: Remove the tie down from service. Snags disrupt the structural integrity of the webbing and can cause further damage under tension.",
        "Fraying": "Damage Identified: Excessive fraying\nAction: Remove the tie down from service. Frayed edges reduce load capacity and indicate long-term wear.",
        "Embedded Particles": "Damage Identified: Embedded particles\nAction: Remove the tie down from service. These can cause abrasion and compromise strength.",
        "Broken Stitching": "Damage Identified: Broken stitching\nAction: Remove the tie down from service. This undermines load-carrying integrity.",
        "Worn Stitching": "Damage Identified: Worn stitching\nAction: Remove the tie down from service. It indicates potential seam failure.",
        "Abrasive Wear": "Damage Identified: Excessive abrasive wear\nAction: Remove the tie down from service. This compromises tensile strength.",
        "Knots": "Damage Identified: Knot in load-bearing webbing\nAction: Remove the tie down from service. Knots introduce weak points.",
        "Melting": "Damage Identified: Melting of webbing\nAction: Remove the tie down from service. Heat damage reduces strength.",
        "Charring": "Damage Identified: Charring on webbing\nAction: Remove the tie down from service. Heat has compromised the material.",
        "Weld Spatter": "Damage Identified: Weld spatter on webbing\nAction: Remove the tie down from service. This creates local failure points.",
        "Chemical Burns": "Damage Identified: Chemical burn\nAction: Remove the tie down from service. Chemicals degrade material safety.",
        "UV Degradation": "Damage Identified: UV degradation\nAction: Remove the tie down from service. This weakens material through sun exposure.",
        "Corroded Hardware": "Damage Identified: Corroded hardware\nAction: Remove the tie down from service. Weakens load integrity.",
        "Other": "Damage Identified: Other significant damage\nAction: Remove the tie down from service. Doubt about strength warrants removal."
      };

      if (Array.isArray(aiJson.damageType)) {
        aiJson.damageType.forEach(type => {
          if (damageMap[type]) {
            damageSummary += damageMap[type] + "\n\n";
          }
        });
      }

      if (aiJson.condition === "PASS") {
        if (aiJson.lineMarker === "One") {
          lineInfo = `Line Marker: One line visible — indicates 5,000 lb/in MBS per WSTDA T-4 Section 2.3.7.`;
        } else if (aiJson.lineMarker === "Two") {
          lineInfo = `Line Marker: Two lines visible — indicates 6,000 lb/in MBS per WSTDA T-4 Section 2.3.7.`;
        } else {
          lineInfo = `Line Marker: None visible — not compliant under WSTDA T-4 Section 2.3.7 unless used in enclosed transport.`;
        }
      }

      recommendation = (aiJson.condition === "FAIL")
        ? "→ Recommendation: Remove this tie-down from service immediately to maintain safety and compliance."
        : (aiJson.condition === "WARNING")
          ? "→ Recommendation: Inspect this tie-down fully before use. Monitor damage and consider retiring it if wear progresses."
          : "→ Recommendation: This strap appears safe for use. Continue with standard inspection protocol.";

      return res.status(200).json({
        result: `→ Condition: ${aiJson.condition}\n${damageSummary}${lineInfo}\n${recommendation}`,
        status: aiJson.status
      });
    }

    if (inspectionType === "tag") {
      return res.status(200).json({
        result: `→ TagScan Result\nTag Status: ${aiJson.tagStatus}\nManufacturer: ${aiJson.manufacturer}\nWLL: ${aiJson.wll}\nUS Compliance: ${aiJson.us_compliance ? "✅" : "❌"}\nCanada Compliance: ${aiJson.ca_compliance ? "✅" : "❌"}`,
        status: aiJson.status
      });
    }

  } catch (error) {
    console.error("Error processing inspection:", error.message, error.stack);
    return res.status(500).json({ error: "Error processing inspection" });
  }
}
