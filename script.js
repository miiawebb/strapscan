function showStandards() {
  const region = document.getElementById("region").value;
  const use = document.getElementById("use").value;
  const box = document.getElementById("standardsBox");

  let html = "";
  const isTieDown = use === "Tie Down / Ratchet Strap";

  if (region === "us") {
    html = isTieDown
      ? `
        <div class="standards-note">
          <strong>🇺🇸 U.S. Tie-Down Inspection Standards:</strong><br>
          • FMCSA 49 CFR §393.102<br>
          • WSTDA T-1<br>
          • CVSA Inspection Criteria<br>
          • OSHA Cargo Securement<br>
          • ANSI / DOT Guidance
        </div>
      `
      : `
        <div class="standards-note">
          <strong>🇺🇸 U.S. Sling/Recovery Strap Inspection Standards:</strong><br>
          • OSHA 1910.184(e)<br>
          • ASME B30.9<br>
          • WSTDA T-4<br>
          • CVSA Securement Guide<br>
          • ANSI Safety Recommendations
        </div>
      `;
  } else if (region === "ca") {
    html = isTieDown
      ? `
        <div class="standards-note">
          <strong>🇨🇦 Canadian Tie-Down Inspection Standards:</strong><br>
          • NSC Standard 10<br>
          • WSTDA T-1<br>
          • CVSA North American Inspection Criteria<br>
          • Bilingual Tag Requirement<br>
          • Transport Canada Securement Guidance
        </div>
      `
      : `
        <div class="standards-note">
          <strong>🇨🇦 Canadian Sling/Recovery Strap Inspection Standards:</strong><br>
          • CSA Z248 / Z150<br>
          • ASME B30.9<br>
          • WSTDA T-4<br>
          • CCOHS & Provincial Regulations<br>
          • Bilingual Label Enforcement (Tag = Mandatory)
        </div>
      `;
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
    resultBox.innerHTML = `<strong>AI Inspection Result:</strong><br>${result}`;

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

// Show preview of uploaded image
document.getElementById("damageUpload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith("image/")) {
    const preview = document.getElementById("damagePreview");
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  }
});

// Initialize standards on load
window.addEventListener("DOMContentLoaded", () => {
  showStandards();
});
