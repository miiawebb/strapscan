import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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
      model: "gpt-4-turbo",
      temperature: 0.2,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: "You are a specialized cargo strap inspection AI. Only detect and classify based on provided prompt."
        },
        {
          role: "user",
          content: [
            { type: "text", text: filledPrompt },
            { type: "image_url", image_url: { url: imageBase64 } }
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
      // Fallback: try to extract keywords manually from freeform text
      const lower = aiRaw.toLowerCase();
      detected.detected = Object.keys(config.standard_responses).filter((key) =>
        lower.includes(key)
      );
      detected.condition = lower.includes("fail")
        ? "FAIL"
        : lower.includes("warning")
        ? "WARNING"
        : "PASS";
    }

    // Pull response strings from config
    const detectedIssues = Array.isArray(detected.detected)
      ? detected.detected
      : [];

    const responseLines = detectedIssues.map((key) => {
      return config.standard_responses[key] || `Detected issue: ${key}`;
    });

    if (responseLines.length === 0) {
      responseLines.push("No significant issues detected.");
    }

    const summary = `→ Condition: ${detected.condition || "PASS"}\n\n${responseLines.join(
      "\n\n"
    )}`;

    return res.status(200).json({
      result: summary,
      status: detected.condition || "PASS"
    });

  } catch (error) {
    console.error("💥 Inspection error:", error.message, error.stack);
    return res.status(500).json({ error: "Inspection failed. Please try again." });
  }
}
