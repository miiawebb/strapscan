// Button selection
document.querySelectorAll(".button-group").forEach(group => {
  group.addEventListener("click", e => {
    if (e.target.tagName === "BUTTON") {
      [...group.children].forEach(btn => btn.classList.remove("selected"));
      e.target.classList.add("selected");
    }
  });
});

// Toggle logic
document.querySelectorAll(".toggle input").forEach(input => {
  input.addEventListener("change", () => {
    const selectedLabel = document.querySelector(`label[for="${input.id}"]`);
    selectedLabel.classList.add("selected");

    document.querySelectorAll(".toggle label").forEach(label => {
      if (label !== selectedLabel) label.classList.remove("selected");
    });
  });
});

// Upload preview
const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("imagePreview");
const text = document.getElementById("uploadText");

imageInput.addEventListener("change", function () {
  const file = this.files[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.innerHTML = `<img src="${e.target.result}" alt="Preview" />`;
      text.style.display = "none";
    };
    reader.readAsDataURL(file);
  }
});

// Inspection logic
document.querySelector(".run-btn").addEventListener("click", async function () {
  const image = document.getElementById("imageInput").files[0];
  const material = document.querySelector("#materialGroup .selected")?.dataset.value || "";
  const width = document.querySelector("#widthGroup .selected")?.dataset.value || "";
  const inspectionType = document.querySelector("#tagScan").checked ? "tag" : "quick";

  const resultBox = document.getElementById("resultBox");
  if (!image) {
    alert("Please upload an image before running inspection.");
    return;
  }

  this.textContent = "Processing... Please wait";
  this.disabled = true;
  resultBox.innerHTML = "";
  resultBox.style.display = "block";

  const reader = new FileReader();
  reader.onload = async function () {
    try {
      const res = await fetch("/api/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: reader.result,
          inspectionType,
          width,
          material
        })
      });

      const data = await res.json();
      if (data.result) {
        let bg = "#2a2a2a";
        if (data.result.includes("→ PASS")) bg = "#134e4a";
        if (data.result.includes("→ WARNING")) bg = "#92400e";
        if (data.result.includes("→ FAIL")) bg = "#7f1d1d";

        resultBox.style.backgroundColor = bg;
        resultBox.innerHTML = `<pre style="white-space: pre-wrap;">${data.result}</pre>`;
      } else {
        resultBox.innerHTML = `<span style="color: orange;">Inspection completed, but no result returned.</span>`;
      }
    } catch (err) {
      console.error("Error during inspection:", err);
      resultBox.innerHTML = `<span style="color: red;">Error processing image.</span>`;
    }

    document.querySelector(".run-btn").textContent = "Run Inspection";
    document.querySelector(".run-btn").disabled = false;
  };

  reader.readAsDataURL(image);
});
