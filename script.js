window.addEventListener("DOMContentLoaded", () => {
  let signaturePad = null;

  function showStandards() {
    const box = document.getElementById("standardsBox");
    if (box) {
      box.innerHTML = `
        <strong>Tie-Down Inspection Standards:</strong><br><br>
        • Web Sling & Tie Down Association, Federal Motor Carrier Safety Administration, Occupational Safety and Health Administration, Commercial Vehicle Safety Alliance, Department of Transportation<br><br>
        • Canadian Standards Association Z150, Canadian Council of Motor Transport Administrators
      `;
    }
  }

  async function showResult() {
    const image1 = document.getElementById("damageUpload")?.files[0];
    const image2 = document.getElementById("secondaryUpload")?.files[0];

    if (!image1 || !image2) {
      alert("Please upload both required images.");
      return;
    }

    const processingMessage = document.getElementById("processingMessage");
    if (processingMessage) processingMessage.style.display = "block";

    const readAsBase64 = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

    const image1Base64 = await readAsBase64(image1);
    const image2Base64 = await readAsBase64(image2);

    const payload = {
      imageBase64: image2Base64,
      material: document.getElementById("material")?.value,
      productType: document.getElementById("use")?.value
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
      if (resultBox) {
        resultBox.style.display = "block";
        const cleanedResult = result.replace(/Detected Damage:.*$/im, "").trim();
        resultBox.innerHTML = `<strong>AI Inspection Result:</strong><br>${cleanedResult}`;

        const damageMatch = result.match(/Detected Damage:\s*(.+)/i);
        let detectedList = [];
        if (damageMatch) {
          const cleaned = damageMatch[1]
            .replace(/[\[\]]/g, "")
            .split(/[\n,]+/)
            .map((d) => d.trim())
            .filter(Boolean);
          const listHtml = cleaned.map((d) => `<li>${d}</li>`).join("");
          resultBox.innerHTML += `<br><br><strong>Detected Damage Types:</strong><ul>${listHtml}</ul>`;
          detectedList = cleaned;
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

        const downloadBtn = document.getElementById("downloadPdfBtn");
        if (downloadBtn) {
          downloadBtn.style.display = "inline-block";
          downloadBtn.onclick = function () {
            const signatureData = signaturePad && !signaturePad.isEmpty()
              ? signaturePad.toDataURL("image/png")
              : null;

            generatePdfReport({
              resultText: cleanedResult,
              detected: detectedList,
              image1: image1Base64,
              image2: image2Base64,
              material: payload.material,
              productType: payload.productType,
              status: cleanResult.includes("FAIL") ? "FAIL" : "PASS",
              signatureData
            });
          };
        }
      }

    } catch (err) {
      console.error("Fetch failed:", err);
      const resultBox = document.getElementById("resultBox");
      if (resultBox) {
        resultBox.style.display = "block";
        resultBox.style.backgroundColor = "#fff3cd";
        resultBox.style.borderColor = "#ffeeba";
        resultBox.style.color = "#856404";
        resultBox.innerHTML = `<strong>Error:</strong><br>Inspection failed. Try again later.`;
      }
    }

    if (processingMessage) processingMessage.style.display = "none";
  }

  // Show previews only after both are uploaded
  function checkAndShowPreview() {
    const img1 = document.getElementById("damagePreview").src;
    const img2 = document.getElementById("secondaryPreview").src;
    const row = document.getElementById("previewRow");

    if (
      img1 && img1.includes("blob:") &&
      img2 && img2.includes("blob:")
    ) {
      row.style.display = "flex";
    }
  }

  document.getElementById("damageUpload")?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const preview = document.getElementById("damagePreview");
      if (preview) {
        preview.src = URL.createObjectURL(file);
        preview.style.display = "block";
        checkAndShowPreview();
      }
    }
  });

  document.getElementById("secondaryUpload")?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const preview = document.getElementById("secondaryPreview");
      if (preview) {
        preview.src = URL.createObjectURL(file);
        preview.style.display = "block";
        checkAndShowPreview();
      }
    }
  });

  const canvas = document.getElementById("signatureCanvas");
  if (canvas) {
    signaturePad = new SignaturePad(canvas, {
      backgroundColor: "#f8f8f8"
    });
  }

  document.getElementById("clearSignatureBtn")?.addEventListener("click", () => {
    if (signaturePad) signaturePad.clear();
  });

  document.getElementById("use")?.addEventListener("change", showStandards);
  showStandards();

  window.showResult = showResult;
  window.showStandards = showStandards;

  // HIDE PREVIEW ROW INITIALLY
  const row = document.getElementById("previewRow");
  if (row) row.style.display = "none";
});
