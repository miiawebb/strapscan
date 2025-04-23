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
    const idImage = document.getElementById("damageUpload")?.files[0];
    const damageImage = document.getElementById("secondaryUpload")?.files[0];

    if (!idImage || !damageImage) {
      alert("Please upload both required images.");
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

    const [idBase64, damageBase64] = await Promise.all([
      readAsBase64(idImage),
      readAsBase64(damageImage)
    ]);

    const payloads = [
      {
        imageBase64: idBase64,
        label: "ID Tag",
        endpoint: "/api/inspect?idTag=true",
        resultBox: document.getElementById("idTagResultBox"),
        inspectionType: "tag"
      },
      {
        imageBase64: damageBase64,
        label: "Damage Area",
        endpoint: "/api/inspect?damage=true",
        resultBox: document.getElementById("damageResultBox"),
        inspectionType: "damage"
      }
    ];

    for (const { imageBase64, label, endpoint, resultBox, inspectionType } of payloads) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64,
            material: document.getElementById("material")?.value,
            productType: document.getElementById("use")?.value,
            inspectionType, // 👈 This makes all the difference
            region: "US" // or dynamically set later
          })
        });

        const { result } = await res.json();
        const cleanText = result.replace(/Detected Damage:.*$/im, "").trim();
        const isFail = result.toUpperCase().includes("FAIL");
        const isPass = result.toUpperCase().includes("PASS");

        resultBox.style.display = "block";
        resultBox.innerHTML = `<strong>${label} Inspection:</strong><br>${cleanText}`;

        if (inspectionType === "tag") {
          // Neutral background for ID tags
          resultBox.style.backgroundColor = "#f2f2f2";
          resultBox.style.borderColor = "#ccc";
          resultBox.style.color = "#000";
        } else {
          if (isFail) {
            resultBox.style.backgroundColor = "#fdecea";
            resultBox.style.borderColor = "#f5c2c7";
            resultBox.style.color = "#b02a37";
          } else if (isPass) {
            resultBox.style.backgroundColor = "#e8f5e9";
            resultBox.style.borderColor = "#c8e6c9";
            resultBox.style.color = "#256029";
          } else {
            resultBox.style.backgroundColor = "#E5EAEF";
            resultBox.style.borderColor = "#ccc";
            resultBox.style.color = "#222";
          }
        }

        if (result.toLowerCase().includes("image unclear") || result.length < 50) {
          resultBox.style.backgroundColor = "#fff3cd";
          resultBox.style.borderColor = "#ffeeba";
          resultBox.style.color = "#000";
          resultBox.innerHTML += `<br><br><strong>Note:</strong> Please upload a higher-quality or zoomed-in image for better inspection accuracy.`;
        }

      } catch (err) {
        console.error(`${label} inspection error:`, err);
        resultBox.style.display = "block";
        resultBox.style.backgroundColor = "#fff3cd";
        resultBox.style.borderColor = "#ffeeba";
        resultBox.style.color = "#000";
        resultBox.innerHTML = `<strong>${label} Inspection:</strong><br>Error: AI inspection failed. Please try again later.`;
      }
    }

    document.getElementById("processingMessage").style.display = "none";
  }

  // Image preview
  document.getElementById("damageUpload")?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const preview = document.getElementById("damagePreview");
      preview.src = URL.createObjectURL(file);
      preview.style.display = "block";
      document.getElementById("previewRow").style.display = "flex";
    }
  });

  document.getElementById("secondaryUpload")?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const preview = document.getElementById("secondaryPreview");
      preview.src = URL.createObjectURL(file);
      preview.style.display = "block";
      document.getElementById("previewRow").style.display = "flex";
    }
  });

  // Signature pad
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
});
