window.addEventListener("DOMContentLoaded", () => {
  let signaturePad;

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
        html = `<strong>Tie-Down / Ratchet Strap Inspection Standards (US):</strong><br>• FMCSA, DOT, NHTSA, WSTDA, OSHA`;
      } else if (isSling) {
        html = `<strong>Lifting Sling Inspection Standards (US):</strong><br>• OSHA, ASME B30, ANSI, WSTDA, NACM, ASTM`;
      } else if (isTow) {
        html = `<strong>Towing / Recovery Strap Best Practices (US):</strong><br>• Recommended: OSHA, ASME B30, WSTDA`;
      }
    } else if (region === "ca") {
      if (isTieDown) {
        html = `<strong>Tie-Down / Ratchet Strap Inspection Standards (CA):</strong><br>• Transport Canada, CCMTA, NSC 10, CVSA, CSA`;
      } else if (isSling) {
        html = `<strong>Lifting Sling Inspection Standards (CA):</strong><br>• CSA B167, ASME B30, ANSI, CCOHS`;
      } else if (isTow) {
        html = `<strong>Towing / Recovery Strap Best Practices (CA):</strong><br>No specific federal regs. Recommended: CSA B167, ASME B30, Provincial OHS`;
      }
    }

    box.innerHTML = html;
  }

  async function showResult() {
    const damageFile = document.getElementById("damageUpload").files[0];
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
      inspectionType: document.getElementById("inspectionType")?.value || "damage"
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
        ? damageMatch[1]
            .replace(/[\[\]]/g, '')
            .split(/[\n,]+/)
            .map((d) => d.trim())
            .filter(Boolean)
        : [];

      if (detectedList.length > 0) {
        const listHtml = detectedList.map((d) => `<li>${d}</li>`).join('');
        resultBox.innerHTML += `<br><br><strong>Detected Damage Types:</strong><ul>${listHtml}</ul>`;
      }

      const cleanResult = result.toUpperCase().replace(/[^A-Z0-9 ]/g, "");
      const status = cleanResult.includes("FAIL") ? "FAIL" : "PASS";
      resultBox.style.backgroundColor = status === "FAIL" ? "#fdecea" : "#e8f5e9";
      resultBox.style.borderColor = status === "FAIL" ? "#f5c2c7" : "#c8e6c9";
      resultBox.style.color = status === "FAIL" ? "#b02a37" : "#256029";

      document.getElementById("processingMessage").style.display = "none";

      document.getElementById("downloadPdfBtn").style.display = "inline-block";
      document.getElementById("downloadPdfBtn").onclick = async function () {
        const signatureData = signaturePad && !signaturePad.isEmpty()
          ? signaturePad.toDataURL("image/png")
          : null;

        const imageElement = document.getElementById("damagePreview");
        const finalImage = new Image();
        finalImage.crossOrigin = "anonymous";
        finalImage.src = imageElement.src;

        finalImage.onload = () => {
          generatePdfReport({
            resultText: cleanedResult,
            detected: detectedList,
            image: finalImage,
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
      document.getElementById("processingMessage").style.display = "none";
      const resultBox = document.getElementById("resultBox");
      resultBox.style.display = "block";
      resultBox.style.backgroundColor = "#fff3cd";
      resultBox.style.borderColor = "#ffeeba";
      resultBox.style.color = "#856404";
      resultBox.innerHTML = `<strong>Error:</strong><br>Inspection failed. Try again later.`;
    }
  }

  function generatePdfReport({ resultText, detected, image, material, productType, region, inspectionType, status, signatureData }) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const timestamp = new Date();
    const formattedDate = timestamp.toLocaleDateString();
    const formattedTime = timestamp.toLocaleTimeString();

    const isPortrait = image.height > image.width;
    const maxImageWidth = isPortrait ? 160 : 90;
    const maxImageHeight = isPortrait ? 90 : 70;

    // Header
    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    doc.text("StrapScan Inspection Report", 14, 20);

    // Table-style layout
    doc.setFontSize(12);
    doc.setFont(undefined, "normal");

    let y = 30;

    if (!isPortrait) {
      // Landscape layout: table left, image right
      doc.text(`Date: ${formattedDate}`, 14, y);
      doc.text(`Time: ${formattedTime}`, 14, y + 6);
      doc.text(`Material: ${material}`, 14, y + 12);
      doc.text(`Type: ${productType}`, 14, y + 18);
      doc.text(`Region: ${region}`, 14, y + 24);
      doc.text(`Inspection: ${inspectionType}`, 14, y + 30);
      doc.addImage(image, "JPEG", 120, y, maxImageWidth, maxImageHeight);
      y += 42;
    } else {
      // Portrait layout: table full-width, image below
      doc.text(`Date: ${formattedDate}    Time: ${formattedTime}`, 14, y);
      y += 8;
      doc.text(`Material: ${material}`, 14, y += 6);
      doc.text(`Type: ${productType}`, 14, y += 6);
      doc.text(`Region: ${region}`, 14, y += 6);
      doc.text(`Inspection: ${inspectionType}`, 14, y += 6);
      doc.addImage(image, "JPEG", 14, y += 10, maxImageWidth, maxImageHeight);
      y += maxImageHeight + 4;
    }

    // Outcome + Summary
    doc.setFont(undefined, "bold");
    doc.text("Inspection Outcome:", 14, y += 10);
    doc.setFont(undefined, "normal");
    doc.text(status === "FAIL" ? "FAIL – should be removed from service" : "PASS – suitable for continued use", 14, y += 6);

    doc.setFont(undefined, "bold");
    doc.text("Summary", 14, y += 10);
    doc.setFont(undefined, "normal");
    const summaryLines = doc.splitTextToSize(resultText, 180);
    doc.text(summaryLines, 14, y += 6);
    y += summaryLines.length * 6;

    if (detected.length > 0) {
      doc.setFont(undefined, "bold");
      doc.text("Detected Damage", 14, y += 8);
      doc.setFont(undefined, "normal");
      detected.forEach(d => doc.text(`• ${d}`, 18, y += 6));
    }

    // Signature
    if (signatureData) {
      doc.setFont(undefined, "bold");
      doc.text("Inspector Signature", 14, y += 12);
      doc.addImage(signatureData, "PNG", 14, y += 4, 80, 20);
      y += 30;
    }

    // Disclaimer
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont(undefined, "normal");
    const disclaimer = `This inspection report was automatically generated using AI-assisted image analysis technology provided by StrapScan. It is designed to assist in preliminary visual evaluations of synthetic webbing products.\n\nStrapScan is not a certified inspection method and should not replace formal evaluations by qualified professionals. This result is based solely on visible image data and may not reflect internal damage or degradation.\n\nUse this report as part of a broader, standards-compliant inspection program. © 2025 StrapScan. All rights reserved.`;
    const disclaimerLines = doc.splitTextToSize(disclaimer, 180);
    doc.text(disclaimerLines, 14, Math.min(y + 12, 270));

    doc.save(`StrapScan_Report_${status}_${Date.now()}.pdf`);
  }

  // Hook everything up
  window.showResult = showResult;
  window.showStandards = showStandards;

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
    signaturePad = new SignaturePad(canvas, {
      backgroundColor: "#fff"
    });
    document.getElementById("clearSignatureBtn").addEventListener("click", () => {
      signaturePad.clear();
    });
  }

  document.getElementById("region").addEventListener("change", showStandards);
  document.getElementById("use").addEventListener("change", showStandards);
  showStandards();
});
