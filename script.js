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
      html = `
        <strong>🇺🇸 Tie-Down / Ratchet Strap Inspection Standards:</strong><br>
        • FMCSA, DOT, NHTSA, WSTDA, OSHA
      `;
    } else if (isSling) {
      html = `
        <strong>🇺🇸 Lifting Sling Inspection Standards:</strong><br>
        • OSHA, ASME B30, ANSI, WSTDA, NACM, ASTM
      `;
    } else if (isTow) {
      html = `
        <strong>🇺🇸 Towing / Recovery Strap Best Practices:</strong><br>
        • Recommended: OSHA, ASME B30, WSTDA
      `;
    }
  } else if (region === "ca") {
    if (isTieDown) {
      html = `
        <strong>🇨🇦 Tie-Down / Ratchet Strap Inspection Standards:</strong><br>
        • Transport Canada, CCMTA, NSC 10, CVSA, CSA
      `;
    } else if (isSling) {
      html = `
        <strong>🇨🇦 Lifting Sling Inspection Standards:</strong><br>
        • CSA B167, ASME B30, ANSI, CCOHS
      `;
    } else if (isTow) {
      html = `
        <strong>🇨🇦 Towing / Recovery Strap Best Practices:</strong><br>
        No specific federal regs.<br>
        Recommended: CSA B167, ASME B30, Provincial OHS
      `;
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
    notes: document.getElementById("additional").value,
  };

  try {
    const res = await fetch("/api/inspect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
        notes: payload.notes,
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

async function generatePdfReport({ resultText, detected, image, material, productType, region, notes, status }) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const dateStr = new Date().toLocaleString();

  doc.setFontSize(18);
  doc.text("StrapScan Inspection Report", 14, 20);

  doc.setFontSize(12);
  doc.text(`Date: ${dateStr}`, 14, 30);
  doc.text(`Result: ${status}`, 14, 38);
  doc.text(`Webbing Type: ${material}`, 14, 46);
  doc.text(`Product Type: ${productType}`, 14, 54);
  doc.text(`Region: ${region}`, 14, 62);

  doc.setFont(undefined, "bold");
  doc.text("Inspection Summary:", 14, 74);
  doc.setFont(undefined, "normal");
  doc.text(doc.splitTextToSize(resultText, 180), 14, 80);

  if (detected.length > 0) {
    const yStart = 90 + (doc.splitTextToSize(resultText, 180).length * 6);
    doc.setFont(undefined, "bold");
    doc.text("Detected Damage Types:", 14, yStart);
    doc.setFont(undefined, "normal");
    detected.forEach((d, i) => {
      doc.text(`• ${d}`, 18, yStart + 8 + (i * 6));
    });
  }

  if (notes) {
    const noteStart = 120 + (detected.length * 6);
    doc.setFont(undefined, "bold");
    doc.text("User Notes:", 14, noteStart);
    doc.setFont(undefined, "normal");
    doc.text(doc.splitTextToSize(notes, 180), 14, noteStart + 6);
  }

  if (image && image.startsWith("data:image")) {
    const imgY = 180;
    doc.setFont(undefined, "bold");
    doc.text("Uploaded Image:", 14, imgY - 6);
    doc.addImage(image, "JPEG", 14, imgY, 60, 60);
  }

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("This report was generated using AI-assisted visual inspection. Final safety assessment must be made by a qualified professional.", 14, 280);

  doc.save(`StrapScan_Report_${status}_${Date.now()}.pdf`);
}

document.getElementById("damageUpload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith("image/")) {
    const preview = document.getElementById("damagePreview");
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  }
});

window.addEventListener("DOMContentLoaded", () => {
  showStandards();
});
