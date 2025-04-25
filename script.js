// ========================
// SELECTION BUTTONS
// ========================
document.querySelectorAll('.button-group').forEach(group => {
  group.addEventListener('click', function (e) {
    if (e.target.tagName === 'BUTTON') {
      [...group.children].forEach(btn => btn.classList.remove('selected'));
      e.target.classList.add('selected');
    }
  });
});

// ========================
// TOGGLE SWITCH
// ========================
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

// ========================
// IMAGE PREVIEW + DRAG SUPPORT
// ========================
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

// ========================
// INSPECTION LOGIC
// ========================
const runButton = document.querySelector(".run-btn");
const resultBox = document.getElementById("resultBox");

runButton.addEventListener("click", async function () {
  const imageInput = document.getElementById("imageInput");
  const file = imageInput.files[0];
  if (!file) {
    alert("Please upload an image before running inspection.");
    return;
  }

  // Set button to loading
  runButton.disabled = true;
  runButton.innerText = "Processing...";

  // Read image as base64
  const reader = new FileReader();
  reader.onload = async function () {
    const imageBase64 = reader.result;

    // Collect input values
    const material = document.querySelector("#materialGroup .selected")?.dataset.value || "";
    const width = document.querySelector("#widthGroup .selected")?.dataset.value || "";
    const scanType = document.querySelector(".toggle input:checked")?.id || "quickScan";

    try {
      const res = await fetch("/api/inspect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          imageBase64,
          material,
          width,
          inspectionType: scanType === "tagScan" ? "tag" : "quick"
        })
      });

      const data = await res.json();

      if (data?.result) {
        resultBox.style.display = "block";
        resultBox.innerText = data.result;
        // Optional: Color code block could be added here
      } else {
        resultBox.style.display = "block";
        resultBox.innerText = "⚠️ No result returned from inspection.";
      }
    } catch (err) {
      console.error("Error during inspection:", err);
      resultBox.style.display = "block";
      resultBox.innerText = "🚫 Error: Failed to complete inspection.";
    }

    // Reset button
    runButton.disabled = false;
    runButton.innerText = "Run Inspection";
  };

  reader.readAsDataURL(file);
});
