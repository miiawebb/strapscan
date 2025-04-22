window.addEventListener("DOMContentLoaded", () => {
  let signaturePad;

  function showStandards() {
    const region = document.getElementById("region")?.value;
    const use = document.getElementById("use")?.value;
    const box = document.getElementById("standardsBox");

    if (!region || !use || !box) return;

    let html = "";

    const isTieDown = use === "Tie Down / Ratchet Strap";
    const isSling = use === "Lifting Sling";
    const isTow = use === "Tow Strap / Recovery Strap";

    if (region === "us") {
      if (isTieDown) {
        html = "<strong>Tie-Down / Ratchet Strap Inspection Standards (US):</strong><br>• FMCSA, DOT, NHTSA, WSTDA, OSHA";
      } else if (isSling) {
        html = "<strong>Lifting Sling Inspection Standards (US):</strong><br>• OSHA, ASME B30, ANSI, WSTDA, NACM, ASTM";
      } else if (isTow) {
        html = "<strong>Towing / Recovery Strap Best Practices (US):</strong><br>• Recommended: OSHA, ASME B30, WSTDA";
      }
    } else if (region === "ca") {
      if (isTieDown) {
        html = "<strong>Tie-Down / Ratchet Strap Inspection Standards (CA):</strong><br>• Transport Canada, CCMTA, NSC 10, CVSA, CSA";
      } else if (isSling) {
        html = "<strong>Lifting Sling Inspection Standards (CA):</strong><br>• CSA B167, ASME B30, ANSI, CCOHS";
      } else if (isTow) {
        html = "<strong>Towing / Recovery Strap Best Practices (CA):</strong><br>No specific federal regs. Recommended: CSA B167, ASME B30, Provincial OHS";
      }
    }

    box.innerHTML = html;
  }

  async function showResult() {
    const damageFile = document.getElementById("damageUpload")?.files?.[0];
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
      inspectionType: document.getElementById("inspectionType").value
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
      const detectedList = damageMatch
        ? damageMatch[1].replace(/[\[\]]/g, "").split(/[\n,]+/).map(d => d.trim()).filter(Boolean)
        : [];

      if (detectedList.length > 0) {
        const listHtml = detectedList.map(d => `<li>${d}</li>`).join('');
        resultBox.innerHTML += `<br><br><strong>Detected Damage Types:</strong><ul>${listHtml}</ul>`;
      }

      const cleanResult = result.toUpperCase().replace(/[^A-Z0-9 ]/g, "");
      const status = cleanResult.includes("FAIL") ? "FAIL" : "PASS";
      resultBox.style.backgroundColor = status === "FAIL" ? "#fdecea" : "#e8f5e9";
      resultBox.style.borderColor = status === "FAIL" ? "#f5c2c7" : "#c8e6c9";
      resultBox.style.color = status === "FAIL" ? "#b02a37" : "#256029";

      document.getElementById("processingMessage").style.display = "none";

      document.getElementById("downloadPdfBtn").style.display = "inline-block";
      document.getElementById("downloadPdfBtn").onclick = () => {
        const signatureData = signaturePad && !signaturePad.isEmpty()
          ? signaturePad.toDataURL("image/png")
          : null;

        const previewImg = new Image();
        previewImg.crossOrigin = "anonymous";
        previewImg.src = document.getElementById("damagePreview").src;

        previewImg.onload = () => {
          generatePdfReport({
            resultText: cleanedResult,
            detected: detectedList,
            image: previewImg,
            material: payload.material,
            productType: payload.productType,
            region: payload.region,
            inspectionType: payload.inspectionType,
            status,
            signatureData
          });
        };
      };
    } catch (err) {
      console.error("Fetch failed:", err);
      const resultBox = document.getElementById("resultBox");
      resultBox.style.display = "block";
      resultBox.style.backgroundColor = "#fff3cd";
      resultBox.style.borderColor = "#ffeeba";
      resultBox.style.color = "#856404";
      resultBox.innerHTML = `<strong>Error:</strong><br>Inspection failed. Try again later.`;
    }

    document.getElementById("processingMessage").style.display = "none";
  }

  function generatePdfReport({ resultText, detected, image, material, productType, region, inspectionType, status, signatureData }) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const banner = new Image();
    banner.crossOrigin = "anonymous";
    banner.src = "https://i.imgur.com/xCVtL06.jpeg";

    const drawPdf = () => {
      const bannerWidth = 210;
      const bannerAspect = banner.height / banner.width;
      const bannerHeight = Math.max(60, bannerWidth * bannerAspect);
      doc.addImage(banner, "JPEG", 0, 0, bannerWidth, bannerHeight);

      let y = bannerHeight + 10;

      doc.setFontSize(16);
      doc.setFont(undefined, "bold");
      doc.text("StrapScan Inspection Report", 14, y);
      y += 10;

      const timestamp = new Date();
      const dateStr = timestamp.toLocaleDateString();
      const timeStr = timestamp.toLocaleTimeString();
      doc.setFontSize(11);
      doc.setFont(undefined, "normal");
      doc.text(`Inspection Timestamp: ${dateStr} – ${timeStr}`, 14, y);
      y += 10;

      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.setTextColor(status === "FAIL" ? "#b02a37" : "#256029");
      doc.text(`INSPECTION OUTCOME: ${status}`, 14, y);
      doc.setTextColor("#000");
      y += 12;

      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("Item Details", 14, y);
      y += 8;
      doc.setFont(undefined, "normal");
      doc.text(`• Webbing Type: ${material}`, 14, y); y += 6;
      doc.text(`• Product Classification: ${productType}`, 14, y); y += 6;
      doc.text(`• Inspection Region: ${region === "us" ? "United States" : "Canada"}`, 14, y); y += 8;

      doc.setFont(undefined, "bold");
      doc.text("Inspection Focus", 14, y);
      y += 8;
      doc.setFont(undefined, "normal");
      doc.text(`• ${inspectionType === "tag" ? "Label Verification" : "Damage Area"}`, 14, y);
      y += 10;

      doc.setFont(undefined, "bold");
      doc.text("Inspection Summary", 14, y);
      y += 8;
      doc.setFont(undefined, "normal");
      const summaryLines = doc.splitTextToSize(`Result: Inspection ${status === "FAIL" ? "Failed" : "Passed"}\n${resultText}`, 180);
      doc.text(summaryLines, 14, y);
      y += summaryLines.length * 6;

      if (detected.length > 0) {
        doc.setFont(undefined, "bold");
        doc.text("Detected Damage Types", 14, y += 10);
        doc.setFont(undefined, "normal");
        detected.forEach(d => {
          doc.text(`• ${d}`, 18, y += 6);
        });
      }

      doc.setFont(undefined, "bold");
      doc.text("Final Recommendation", 14, y += 12);
      doc.setFont(undefined, "normal");
      const recommendation = status === "FAIL"
        ? "Action Required: This strap is not safe for continued use. It must be taken out of service and replaced. Use of damaged webbing can result in catastrophic failure under load, posing serious risk to personnel and equipment."
        : "No action required: This strap passed the visual inspection and shows no signs of critical damage. Continue regular monitoring as part of your safety protocol.";
      const recLines = doc.splitTextToSize(recommendation, 180);
      doc.text(recLines, 14, y += 8);
      y += recLines.length * 6;

      doc.setFont(undefined, "bold");
      doc.text("Uploaded Photo", 14, y += 12);
      const isPortrait = image.height > image.width;
      const imgWidth = isPortrait ? 90 : 130;
      const imgHeight = isPortrait ? 120 : 80;
      doc.addImage(image, "JPEG", 14, y += 4, imgWidth, imgHeight);
      y += imgHeight + 8;

      if (signatureData) {
        doc.setFont(undefined, "bold");
        doc.text("Inspector Signature", 14, y += 10);
        doc.addImage(signatureData, "PNG", 14, y += 4, 80, 20);
        y += 30;
      }

      const footerY = doc.internal.pageSize.height - 28;
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.setFont(undefined, "normal");
      const disclaimer = `This inspection report was automatically generated using AI-assisted image analysis provided by StrapScan. It supports visual evaluation of synthetic webbing products. This is not a certified inspection and should be reviewed by a qualified professional. © 2025 StrapScan. All rights reserved.`;
      const footerLines = doc.splitTextToSize(disclaimer, 180);
      doc.text(footerLines, 14, footerY);

      doc.save(`StrapScan_Report_${status}_${Date.now()}.pdf`);
    };

    if (banner.complete) {
      drawPdf();
    } else {
      banner.onload = drawPdf;
    }
  }

  // Event bindings
  document.getElementById("damageUpload").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const preview = document.getElementById("damagePreview");
      preview.src = URL.createObjectURL(file);
      preview.style.display = "block";
    }
  });

  const canvas = document.getElementById("signatureCanvas");
  if (canvas) {
    signaturePad = new SignaturePad(canvas, { backgroundColor: "#fff" });
    document.getElementById("clearSignatureBtn").addEventListener("click", () => signaturePad.clear());
  }

  document.getElementById("region").addEventListener("change", showStandards);
  document.getElementById("use").addEventListener("change", showStandards);

  window.showResult = showResult;
  window.showStandards = showStandards;
  window.generatePdfReport = generatePdfReport;

  showStandards(); // trigger once on load
});
