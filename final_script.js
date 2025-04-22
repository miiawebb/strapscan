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
    const fileInput = document.getElementById("damageUpload");
    const damageFile = fileInput?.files?.[0];
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

  // Generate PDF function placeholder (already built in previous step)
  window.generatePdfReport = generatePdfReport;

  // Hook image preview
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
  showStandards();
});