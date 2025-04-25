import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Load inspection configuration
const configPath = path.join(process.cwd(), "inspection-config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageBase64, inspectionType, material, productType, region, webbingWidth } = req.body;

  if (!imageBase64 || !inspectionType) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const agentKey = inspectionType === "tag" ? "tagScan" : "quickScan";
  const agent = config.agents[agentKey];
  if (!agent) {
    return res.status(400).json({ error: "Invalid inspection type." });
  }

  const filledPrompt = agent.prompt
    .replace("${width}", webbingWidth || "unknown width")
    .replace("${material}", material || "unknown material");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",  // ✅ Using current working Vision model
      temperature: 0.2,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: "You are a specialized cargo strap inspection AI. Only detect and classify based on the prompt. Return strict JSON only. No freeform descriptions."
        },
        {
          role: "user",
          content: [
            { type: "text", text: filledPrompt },
            { type: "image_url", image_url: { url: imageBase64, detail: "high" } }
          ]
        }
      ]
    });

    const aiRaw = response.choices[0]?.message?.content?.trim();

    if (!aiRaw) {
      console.error("❌ AI response was empty.");
      return res.status(500).json({ error: "Empty AI response." });
    }

    console.log("📨 Raw AI Output:\n", aiRaw);

    let detected = {};
    try {
      detected = JSON.parse(aiRaw);
    } catch (err) {
      console.error("❌ Failed to parse JSON:", err.message);
      return res.status(500).json({ error: "Invalid AI JSON response.", raw: aiRaw });
    }

    // Handle QuickScan or TagScan separately
    if (inspectionType === "quick") {
      // QuickScan expects detected.damageType as array
      const issues = Array.isArray(detected.damageType) ? detected.damageType : [];

      const responseLines = issues.map((key) => {
        return config.standard_responses[key.toLowerCase()] || `Detected issue: ${key}`;
      });

      if (responseLines.length === 0) {
        responseLines.push("No significant issues detected.");
      }

      const condition = detected.condition || "PASS";

      return res.status(200).json({
        result: `→ Condition: ${condition}\n\n${responseLines.join("\n\n")}`,
        status: condition
      });

    } else if (inspectionType === "tag") {
      // TagScan expects tagStatus, manufacturer, wll, compliance
      return res.status(200).json({
        result: `→ TagScan Result\nTag Status: ${detected.tagStatus || "Unknown"}\nManufacturer: ${detected.manufacturer || "Unknown"}\nWLL: ${detected.wll || "Unknown"}\nUS Compliance: ${detected.us_compliance ? "✅" : "❌"}\nCanada Compliance: ${detected.ca_compliance ? "✅" : "❌"}`,
        status: detected.status || detected.tagStatus || "PASS"
      });
    }

  } catch (error) {
    console.error("💥 Inspection error:", error.message, error.stack);
    return res.status(500).json({ error: "Inspection failed. Please try again." });
  }
}
