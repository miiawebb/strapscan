// Button selection logic for webbing material
const materialButtons = document.querySelectorAll("#materialGroup button");
materialButtons.forEach(button => {
  button.addEventListener("click", () => {
    materialButtons.forEach(btn => btn.classList.remove("selected"));
    button.classList.add("selected");
  });
});

// Button selection logic for webbing width
const widthButtons = document.querySelectorAll("#widthGroup button");
widthButtons.forEach(button => {
  button.addEventListener("click", () => {
    widthButtons.forEach(btn => btn.classList.remove("selected"));
    button.classList.add("selected");
  });
});

// Toggle logic for inspection type
const toggleInputs = document.querySelectorAll(".toggle input");
toggleInputs.forEach(input => {
  input.addEventListener("change", () => {
    const selectedLabel = document.querySelector(".toggle label[for='" + input.id + "']");
    selectedLabel.classList.add("selected");
    toggleInputs.forEach(toggleInput => {
      if (toggleInput !== input) {
        const label = document.querySelector(".toggle label[for='" + toggleInput.id + "']");
        label.classList.remove("selected");
      }
    });
  });
});

// Image upload preview functionality
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const uploadBox = document.getElementById("uploadBox");
const uploadText = document.getElementById("uploadText");

imageInput.addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function () {
      imagePreview.innerHTML = `<img src="${reader.result}" alt="Strap Image Preview" />`;
      uploadText.style.display = "none"; // Hide the upload text after image is added
    };
    reader.readAsDataURL(file);
  }
});

// Drag-and-drop support for image uploads
uploadBox.addEventListener("dragover", function (e) {
  e.preventDefault();
  uploadBox.style.borderColor = "#ff6600";
});

uploadBox.addEventListener("dragleave", function (e) {
  e.preventDefault();
  uploadBox.style.borderColor = "#aaa";
});

uploadBox.addEventListener("drop", function (e) {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function () {
      imagePreview.innerHTML = `<img src="${reader.result}" alt="Strap Image Preview" />`;
      uploadText.style.display = "none";
    };
    reader.readAsDataURL(file);
  }
});

// Run Inspection button click logic
const runButton = document.querySelector(".run-btn");
runButton.addEventListener("click", function () {
  const file = imageInput.files[0];
  if (!file) {
    alert("Please upload an image.");
    return;
  }

  const reader = new FileReader();
  reader.onload = async function () {
    const imageBase64 = reader.result;

    const width = document.querySelector("#widthGroup .selected")?.dataset.value || "";
    const material = document.querySelector("#materialGroup .selected")?.dataset.value || "";
    const inspectionType = document.querySelector(".toggle input:checked")?.id || "quick";

    runButton.innerText = "Processing...";
    runButton.disabled = true;

    try {
      const res = await fetch("/api/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          width,
          material,
          inspectionType
        })
      });

      const data = await res.json();

      const inspectionResults = document.getElementById("inspectionResults");
      const messageBox = document.getElementById("inspectionMessage");
      const statusBox = document.getElementById("inspectionStatus");

      if (!res.ok || !data || !data.result) {
        throw new Error("Server responded with error: " + (data?.error || "Unknown error"));
      }

      // Show result
      inspectionResults.style.display = "block";

      const resultText = data.result.trim();
      const status = resultText.match(/→ (PASS|FAIL|WARNING)/i)?.[1] || "UNKNOWN";

      // Set background color based on result
      let bgColor = "#2a2a2a";
      if (status === "PASS") bgColor = "#256029";
      else if (status === "FAIL") bgColor = "#b02a37";
      else if (status === "WARNING") bgColor = "#c57d00";

      inspectionResults.style.backgroundColor = bgColor;

      messageBox.innerHTML = resultText;
      statusBox.innerText = `Status: ${status}`;

    } catch (err) {
      console.error("Error during inspection:", err);
      alert("There was an error processing the inspection. Please try again.");
    }

    runButton.innerText = "Run Inspection";
    runButton.disabled = false;
  };

  reader.readAsDataURL(file);
});
