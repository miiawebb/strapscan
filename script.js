window.addEventListener("DOMContentLoaded", () => {
  function showStandards() {
    const region = document.getElementById("region").value;
    const use = document.getElementById("use").value;
    const box = document.getElementById("standardsBox");

    let html = "";

    const isTieDown = use === "Tie Down / Ratchet Strap";
    const isSling = use === "Lifting Sling";
    const isTow = use === "Tow Strap / Recovery Strap";

    if (region === "us") {
      if (isTieDown) {
        html = `<strong>🇺🇸 Tie-Down / Ratchet Strap Inspection Standards:</strong><br>• FMCSA, DOT, NHTSA, WSTDA, OSHA`;
      } else if (isSling) {
        html = `<strong>🇺🇸 Lifting Sling Inspection Standards:</strong><br>• OSHA, ASME B30, ANSI, WSTDA, NACM, ASTM`;
      } else if (isTow) {
        html = `<strong>🇺🇸 Towing / Recovery Strap Best Practices:</strong><br>• Recommended: OSHA, ASME B30, WSTDA`;
      }
    } else if (region === "ca") {
      if (isTieDown) {
        html = `<strong>🇨🇦 Tie-Down / Ratchet Strap Inspection Standards:</strong><br>• Transport Canada, CCMTA, NSC 10, CVSA, CSA`;
      } else if (isSling) {
        html = `<strong>🇨🇦 Lifting Sling Inspection Standards:</strong><br>• CSA B167, ASME B30, ANSI, CCOHS`;
      } else if (isTow) {
        html = `<strong>🇨🇦 Towing / Recovery Strap Best Practices:</strong><br>No specific federal regs.<br>Recommended: CSA B167, ASME B30, Provincial OHS`;
      }
    }

    box.innerHTML = html;
  }

  async function showResult() {
    const damageFile = document.getElementById("damageUpload").files[0];
    const inspectionType = document.getElementById("inspectionType").value;

    if (!damageFile) {
      alert("Please upload the damaged area photo.");
      return;
    }

    document.getElementById("processingMessage").style.display = "block";

    const readAsBase64 = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    const damageBase64 = await readAsBase64(damageFile);

    if (!damageBase64.startsWith("data:image")) {
      alert("The uploaded file is not a valid image.");
      document.getElementById("processingMessage").style.display = "none";
      return;
    }

    const payload = {
      imageBase64: damageBase64,
      material: document.getElementById("material").value,
      productType: document.getElementById("use").value,
      region: document.getElementById("region").value,
      inspectionType
    };

    try {
      const res = await fetch("/api/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      const result = data.result;

      const resultBox = document.getElementById("resultBox");
      resultBox.style.display = "block";

      const cleanedResult = result.replace(/Detected Damage:.*$/im, "").trim();
      resultBox.innerHTML = `<strong>AI Inspection Result:</strong><br>${cleanedResult}`;

      const damageMatch = result.match(/Detected Damage:\s*(.+)/i);
      if (damageMatch) {
        const damageList = damageMatch[1].split(',').map(d => d.trim());
        const listHtml = damageList.map(d => `<li>${d}</li>`).join('');
        resultBox.innerHTML += `<br><br><strong>Detected Damage Types:</strong><ul>${listHtml}</ul>`;
      }

      const cleanResult = result.toUpperCase().replace(/[^A-Z0-9 ]/g, "");
      if (cleanResult.includes("FAIL")) {
        resultBox.style.backgroundColor = "#fdecea";
        resultBox.style.borderColor = "#f5c2c7";
        resultBox.style.color = "#b02a37";
      } else if (cleanResult.includes("PASS")) {
        resultBox.style.backgroundColor = "#e8f5e9";
        resultBox.style.borderColor = "#c8e6c9";
        resultBox.style.color = "#256029";
      } else {
        resultBox.style.backgroundColor = "#E5EAEF";
        resultBox.style.borderColor = "#ccc";
        resultBox.style.color = "#222";
      }

      document.getElementById("processingMessage").style.display = "none";

      document.getElementById("downloadPdfBtn").style.display = "inline-block";
      document.getElementById("downloadPdfBtn").onclick = function () {
        generatePdfReport({
          resultText: cleanedResult,
          detected: damageMatch ? damageMatch[1].split(',').map(d => d.trim()) : [],
          image: document.getElementById("damagePreview").src,
          material: payload.material,
          productType: payload.productType,
          region: payload.region,
          inspectionType: payload.inspectionType,
          status: cleanResult.includes("FAIL") ? "FAIL" : "PASS"
        });
      };
    } catch (err) {
      console.error("Fetch failed:", err);
      document.getElementById("processingMessage").style.display = "none";
      const resultBox = document.getElementById("resultBox");
      resultBox.style.display = "block";
      resultBox.style.backgroundColor = "#fff3cd";
      resultBox.style.borderColor = "#ffeeba";
      resultBox.style.color = "#856404";
      resultBox.innerHTML = `<strong>Error:</strong><br>Inspection failed. Try again later.`;
    }
  }

    function generatePdfReport({ resultText, detected, image, material, productType, region, inspectionType, status }) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const banner = new Image();
    banner.crossOrigin = "anonymous";
    banner.src = "https://i.imgur.com/xCVtL06.jpeg"; // same as your main page

    banner.onload = () => {
    doc.addImage(banner, "JPEG", 0, 0, 210, 60); // full width at top
    let yPos = 70;

    // The rest of the content goes below this:

    const timestamp = new Date();
    const formattedDate = timestamp.toLocaleDateString();
    const formattedTime = timestamp.toLocaleTimeString();

    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    doc.text("StrapScan Inspection Report", 14, 20);

    doc.setFontSize(12);
    doc.setFont(undefined, "normal");
    doc.text(`Inspection Timestamp:`, 14, 30);
    doc.text(`${formattedDate} – ${formattedTime}`, 60, 30);

    doc.setFont(undefined, "bold");
    doc.text("Inspection Outcome:", 14, 42);
    doc.setFont(undefined, "normal");
    doc.text(status === "FAIL" ? "FAIL" : "PASS", 60, 42);

    doc.setFont(undefined, "bold");
    doc.text("Item Details", 14, 54);
    doc.setFont(undefined, "normal");
    doc.text(`Webbing Type: ${material}`, 14, 60);
    doc.text(`Product Classification: ${productType}`, 14, 66);
    doc.text(`Inspection Region: ${region}`, 14, 72);

    doc.setFont(undefined, "bold");
    doc.text("Inspection Focus", 14, 82);
    doc.setFont(undefined, "normal");
    doc.text(inspectionType === "tag" ? "Product Tag / Label" : "Damage Area", 14, 88);

    doc.setFont(undefined, "bold");
    doc.text("Inspection Summary", 14, 98);
    doc.setFont(undefined, "normal");
    const resultLines = doc.splitTextToSize(`Result: Inspection ${status === "FAIL" ? "Failed" : "Passed"}\n${resultText}`, 180);
    doc.text(resultLines, 14, 104);
    let yPos = 104 + resultLines.length * 6;

    if (status === "FAIL" && detected.length > 0) {
      doc.setFont(undefined, "bold");
      doc.text("Detected Damage Types", 14, yPos += 10);
      doc.setFont(undefined, "normal");
      detected.forEach((d) => {
        doc.text(`• ${d}`, 18, yPos += 6);
      });
    }

    doc.setFont(undefined, "bold");
    doc.text("Final Recommendation", 14, yPos += 12);
    doc.setFont(undefined, "normal");
    const recommendation = status === "FAIL"
      ? "Action Required: This strap is not safe for continued use. It must be taken out of service and replaced. Use of damaged webbing can result in catastrophic failure under load, posing serious risk to personnel and equipment."
      : "No action required: This strap passed the visual inspection and shows no signs of critical damage. Continue regular monitoring as part of your safety protocol.";
    const recLines = doc.splitTextToSize(recommendation, 180);
    doc.text(recLines, 14, yPos += 8);
    yPos += recLines.length * 6;

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont(undefined, "normal");
    const disclaimer = `This inspection report was automatically generated using AI-assisted image analysis technology provided by StrapScan. It is designed to assist in preliminary visual evaluations of synthetic webbing products.

StrapScan is not a certified inspection method and should not replace formal evaluations by qualified professionals. This result is based solely on visible image data and may not reflect internal damage or degradation.

Use this report as part of a broader, standards-compliant inspection program. © 2025 StrapScan. All rights reserved.`;
    const disclaimerLines = doc.splitTextToSize(disclaimer, 180);
    doc.text(disclaimerLines, 14, Math.min(yPos + 12, 270));

    doc.save(`StrapScan_Report_${status}_${Date.now()}.pdf`);
  }

  window.showResult = showResult;

  document.getElementById("damageUpload").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const preview = document.getElementById("damagePreview");
      preview.src = URL.createObjectURL(file);
      preview.style.display = "block";
    }
  });

  document.getElementById("region").addEventListener("change", showStandards);
  document.getElementById("use").addEventListener("change", showStandards);
  showStandards();
});
