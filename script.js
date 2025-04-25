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
      uploadText.style.display = "none";
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

// Run Inspection button logic
const runButton = document.querySelector(".run-btn");
const resultBox = document.getElementById("resultBox");
const inspectButton = document.querySelector(".run-btn");

runButton.addEventListener("click", async function () {
  const file = imageInput.files[0];
  const inspectionType = document.querySelector('input[name="scanType"]:checked')?.id || "quick";
  const material = document.querySelector("#materialGroup .selected")?.textContent || "";
  const width = document.querySelector("#widthGroup .selected")?.textContent || "";

  if (!file) {
    alert("Please upload a strap image.");
    return;
  }

  inspectButton.disabled = true;
  inspectButton.textContent = "Processing...";

  const reader = new FileReader();
  reader.onload = async function () {
    const base64 = reader.result;

    const payload = {
      imageBase64: base64,
      inspectionType,
      material,
      width
    };

    try {
      const res = await fetch("/api/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error("Server responded with error: " + errorText);
      }

      const data = await res.json();

      // Show result in UI
      resultBox.style.display = "block";
      resultBox.innerHTML = data.result || "No result returned.";
      inspectButton.textContent = "Run Inspection";
      inspectButton.disabled = false;
    } catch (err) {
      console.error("Error during inspection:", err.message);
      resultBox.innerHTML = `<strong>Error:</strong><br>${err.message}`;
      resultBox.style.display = "block";
      inspectButton.textContent = "Run Inspection";
      inspectButton.disabled = false;
    }
  };

  reader.readAsDataURL(file);
});
