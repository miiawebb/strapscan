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

    // Banner
    const banner = new Image();
    banner.src = "/mnt/data/StrapScan.jpg"; // adjust if you're hosting externally
    banner.onload = () => {
      doc.addImage(banner, "JPEG", 0, 0, 210, 25);

      let y = 35;
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text("Inspection Details", 14, y);

      // Draw structured data block
      doc.setFont(undefined, "normal");
      const timestamp = new Date();
      const dateTime = `${timestamp.toLocaleDateString()}  ${timestamp.toLocaleTimeString()}`;
      const details = [
        `Date & Time: ${dateTime}`,
        `Webbing Material: ${material}`,
        `Product Type: ${productType}`,
        `Region: ${region}`,
        `Inspection Type: ${inspectionType === "tag" ? "Label Verification" : "Damage Analysis"}`
      ];

      let tableY = y + 6;
      details.forEach(line => {
        doc.text(line, 14, tableY);
        tableY += 6;
      });

      // Insert Image
      const imgX = 110;
      const imgY = y + 6;
      const imgMaxW = 85;
      const imgMaxH = 65;

      let imgW = image.width;
      let imgH = image.height;
      if (imgW > imgH) {
        const scale = imgMaxW / imgW;
        imgW = imgMaxW;
        imgH = imgH * scale;
      } else {
        const scale = imgMaxH / imgH;
        imgH = imgMaxH;
        imgW = imgW * scale;
      }

      doc.addImage(image, "JPEG", imgX, imgY, imgW, imgH);
      let yBottom = Math.max(tableY, imgY + imgH) + 10;

      // Outcome
      doc.setFont(undefined, "bold");
      doc.text("Inspection Outcome:", 14, yBottom);
      doc.setFont(undefined, "normal");
      doc.text(status, 60, yBottom);

      // Summary
      doc.setFont(undefined, "bold");
      doc.text("Summary", 14, yBottom += 10);
      doc.setFont(undefined, "normal");
      const summaryLines = doc.splitTextToSize(resultText, 180);
      doc.text(summaryLines, 14, yBottom += 6);
      yBottom += summaryLines.length * 5;

      // Detected damage
      if (detected.length > 0) {
        doc.setFont(undefined, "bold");
        doc.text("Detected Damage Types", 14, yBottom += 10);
        doc.setFont(undefined, "normal");
        detected.forEach(d => {
          doc.text(`• ${d}`, 18, yBottom += 6);
        });
      }

      // Signature
      if (signatureData) {
        doc.setFont(undefined, "bold");
        doc.text("Inspector Signature", 14, yBottom += 14);
        doc.addImage(signatureData, "PNG", 14, yBottom + 4, 80, 20);
        yBottom += 32;
      }

      // Footer disclaimer
      const pageHeight = doc.internal.pageSize.height;
      const footerY = pageHeight - 30;
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.setFont(undefined, "normal");
      const disclaimer = `This inspection report was automatically generated using AI-powered image analysis from StrapScan. It is a tool to assist in visual inspections and does not replace a certified evaluation. Final judgment should be made by qualified professionals under applicable standards.`;
      const disclaimerLines = doc.splitTextToSize(disclaimer, 180);
      doc.text(disclaimerLines, 14, footerY);

      doc.save(`StrapScan_Report_${status}_${Date.now()}.pdf`);
    };
  }

  // Init
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
