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
        ? damageMatch[1]
            .replace(/[\[\]]/g, '')
            .split(/[\n,]+/)
            .map(d => d.trim())
            .filter(Boolean)
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

        const imageElement = document.getElementById("damagePreview");
        const previewImg = new Image();
        previewImg.crossOrigin = "anonymous";
        previewImg.src = imageElement.src;

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

    const banner = new Image();
    banner.crossOrigin = "anonymous";
    banner.src = "https://i.imgur.com/xCVtL06.jpeg"; // your hosted banner

    const drawPdf = () => {
      doc.addImage(banner, "JPEG", 0, 0, 210, 25);

      let y = 35;
      const timestamp = new Date();
      const dateTime = `${timestamp.toLocaleDateString()}  ${timestamp.toLocaleTimeString()}`;

      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("Inspection Details", 14, y);

      doc.setFont(undefined, "normal");
      const details = [
        `Date & Time: ${dateTime}`,
        `Material: ${material}`,
        `Product Type: ${productType}`,
        `Region: ${region}`,
        `Inspection: ${inspectionType === "tag" ? "Label Verification" : "Damage Analysis"}`
      ];

      let detailY = y + 6;
      details.forEach(line => {
        doc.text(line, 14, detailY);
        detailY += 6;
      });

      // Image scaling
      const imgX = 110;
      const imgY = y + 6;
      let imgW = image.width;
      let imgH = image.height;
      const maxW = 85;
      const maxH = 65;

      if (imgW > imgH) {
        const scale = maxW / imgW;
        imgW = maxW;
        imgH *= scale;
      } else {
        const scale = maxH / imgH;
        imgH = maxH;
        imgW *= scale;
      }

      doc.addImage(image, "JPEG", imgX, imgY, imgW, imgH);
      let yPos = Math.max(detailY, imgY + imgH) + 10;

      doc.setFont(undefined, "bold");
      doc.text("Outcome:", 14, yPos);
      doc.setFont(undefined, "normal");
      doc.text(status, 50, yPos);

      doc.setFont(undefined, "bold");
      doc.text("Summary", 14, yPos += 10);
      doc.setFont(undefined, "normal");
      const summaryLines = doc.splitTextToSize(resultText, 180);
      doc.text(summaryLines, 14, yPos += 6);
      yPos += summaryLines.length * 6;

      if (detected.length > 0) {
        doc.setFont(undefined, "bold");
        doc.text("Detected Damage", 14, yPos += 8);
        doc.setFont(undefined, "normal");
        detected.forEach(d => doc.text(`• ${d}`, 18, yPos += 6));
      }

      if (signatureData) {
        doc.setFont(undefined, "bold");
        doc.text("Inspector Signature", 14, yPos += 12);
        doc.addImage(signatureData, "PNG", 14, yPos += 4, 80, 20);
        yPos += 30;
      }

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      const footerY = pageHeight - 30;
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.setFont(undefined, "normal");
      const disclaimer = `This inspection report was generated using AI-assisted image analysis via StrapScan. This is not a certified inspection and should be reviewed by a qualified professional. © 2025 StrapScan. All rights reserved.`;
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

  // --- INIT ---

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
    signaturePad = new SignaturePad(canvas, { backgroundColor: "#fff" });
    document.getElementById("clearSignatureBtn").addEventListener("click", () => signaturePad.clear());
  }

  document.getElementById("region").addEventListener("change", showStandards);
  document.getElementById("use").addEventListener("change", showStandards);
  showStandards();
});
