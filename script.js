function showStandards() {
  const region = document.getElementById("region").value;
  const use = document.getElementById("use").value;
  const box = document.getElementById("standardsBox");

  let html = "";

  const isTieDown = use.includes("Tie Down") || use.includes("Ratchet");
  const isSling = use.includes("Sling") || use.includes("Roundsling");
  const isTow = use.includes("Towing") || use.includes("Recovery");

  if (region === "us") {
    if (isTieDown) {
      html = `
        <strong>🇺🇸 U.S. Tie-Down / Ratchet Strap Inspection Standards:</strong><br>
        • FMCSA (Federal Motor Carrier Safety Administration)<br>
        • DOT (Department of Transportation)<br>
        • NHTSA (National Highway Traffic Safety Administration)<br>
        • WSTDA (Web Sling & Tie Down Association)<br>
        • OSHA (Occupational Safety and Health Administration)
      `;
    } else if (isSling) {
      html = `
        <strong>🇺🇸 U.S. Lifting Sling Inspection Standards:</strong><br>
        • OSHA (Occupational Safety and Health Administration)<br>
        • ASME (B30 Series)<br>
        • ANSI (American National Standards Institute)<br>
        • WSTDA (WS and RS standards)<br>
        • NACM (National Association of Chain Manufacturers)<br>
        • ASTM International<br>
        • FMCSA (if used in transport securement)
      `;
    } else if (isTow) {
      html = `
        <strong>🇺🇸 U.S. Towing / Recovery Strap Best Practices:</strong><br>
        There are no formal federal regulations specific to towing or recovery straps.<br>
        Recommended to follow:<br>
        • OSHA<br>
        • ASME B30<br>
        • WSTDA manufacturing and inspection standards
      `;
    }
  } else if (region === "ca") {
    if (isTieDown) {
      html = `
        <strong>🇨🇦 Canadian Tie-Down / Ratchet Strap Inspection Standards:</strong><br>
        • Transport Canada<br>
        • CCMTA (Canadian Council of Motor Transport Administrators)<br>
        • NSC Standard 10 (Cargo Securement)<br>
        • CVSA (North American Cargo Securement Standard)<br>
        • CSA Group (Canadian Standards Association)
      `;
    } else if (isSling) {
      html = `
        <strong>🇨🇦 Canadian Lifting Sling Inspection Standards:</strong><br>
        • CSA Group (e.g., CSA B167)<br>
        • ASME (B30 Series – partially adopted)<br>
        • ANSI (in some jurisdictions)<br>
        • CVSA (where applicable)<br>
        • CCOHS (Canadian Centre for Occupational Health and Safety)
      `;
    } else if (isTow) {
      html = `
        <strong>🇨🇦 Canadian Towing / Recovery Strap Best Practices:</strong><br>
        No specific federal towing strap regulations exist.<br>
        Industry best practice includes:<br>
        • CSA B167<br>
        • ASME B30<br>
        • Provincial OHS guidelines
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
