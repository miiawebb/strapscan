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
      alert("Please upload both images.");
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
      { imageBase64: idBase64, label: "ID Tag" },
      { imageBase64: damageBase64, label: "Damage Area" }
    ];

    const [idResultBox, damageResultBox] = [
      document.getElementById("idTagResultBox"),
      document.getElementById("damageResultBox")
    ];

    for (let i = 0; i < payloads.length; i++) {
      const { imageBase64, label } = payloads[i];
      const resultBox = i === 0 ? idResultBox : damageResultBox;

      try {
        const res = await fetch("/api/inspect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64,
            material: document.getElementById("material")?.value,
            productType: document.getElementById("use")?.value
          })
        });

        const { result } = await res.json();
        const cleanedResult = result.replace(/Detected Damage:.*$/im, "").trim();
        const clean = result.toUpperCase().replace(/[^A-Z0-9 ]/g, "");

        resultBox.style.display = "block";
        resultBox.innerHTML = `<strong>${label} Inspection:</strong><br>${cleanedResult}`;

        if (clean.includes("FAIL")) {
          resultBox.style.backgroundColor = "#fdecea";
          resultBox.style.borderColor = "#f5c2c7";
          resultBox.style.color = "#b02a37";
        } else if (clean.includes("PASS")) {
          resultBox.style.backgroundColor = "#e8f5e9";
          resultBox.style.borderColor = "#c8e6c9";
          resultBox.style.color = "#256029";
        } else {
          resultBox.style.backgroundColor = "#E5EAEF";
          resultBox.style.borderColor = "#ccc";
          resultBox.style.color = "#222";
        }

      } catch (err) {
        console.error(`${label} inspection error:`, err);
        resultBox.style.display = "block";
        resultBox.style.backgroundColor = "#fff3cd";
        resultBox.style.borderColor = "#ffeeba";
        resultBox.style.color = "#856404";
        resultBox.innerHTML = `<strong>${label} Inspection:</strong><br>Inspection failed. Try again later.`;
      }
    }

    document.getElementById("processingMessage").style.display = "none";
  }

  // Image Previews
  document.getElementById("damageUpload")?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById("damagePreview");
    if (file && file.type.startsWith("image/")) {
      preview.src = URL.createObjectURL(file);
      preview.style.display = "block";
      document.getElementById("previewRow").style.display = "flex";
    }
  });

  document.getElementById("secondaryUpload")?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById("secondaryPreview");
    if (file && file.type.startsWith("image/")) {
      preview.src = URL.createObjectURL(file);
      preview.style.display = "block";
      document.getElementById("previewRow").style.display = "flex";
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
});
