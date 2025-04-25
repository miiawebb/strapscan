document.addEventListener("DOMContentLoaded", function () {
  // --- Webbing Material Selection ---
  const materialButtons = document.querySelectorAll("#materialGroup button");
  materialButtons.forEach(button => {
    button.addEventListener("click", () => {
      materialButtons.forEach(btn => btn.classList.remove("selected"));
      button.classList.add("selected");
    });
  });

  // --- Webbing Width Selection ---
  const widthButtons = document.querySelectorAll("#widthGroup button");
  widthButtons.forEach(button => {
    button.addEventListener("click", () => {
      widthButtons.forEach(btn => btn.classList.remove("selected"));
      button.classList.add("selected");
    });
  });

  // --- Toggle Selection (TagScan / QuickScan) ---
  const toggleInputs = document.querySelectorAll(".toggle input");
  toggleInputs.forEach(input => {
    input.addEventListener("change", () => {
      toggleInputs.forEach(toggleInput => {
        const label = document.querySelector(`label[for='${toggleInput.id}']`);
        if (label) label.classList.remove("selected");
      });
      const selectedLabel = document.querySelector(`label[for='${input.id}']`);
      if (selectedLabel) selectedLabel.classList.add("selected");
    });
  });

  // --- Image Upload Preview ---
  const imageInput = document.getElementById("imageInput");
  const imagePreview = document.getElementById("imagePreview");
  const uploadBox = document.getElementById("uploadBox");
  const uploadText = document.getElementById("uploadText");

  if (imageInput) {
    imageInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = function () {
          imagePreview.innerHTML = `<img src="${reader.result}" alt="Strap Image Preview" />`;
          uploadText.style.display = "none";
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (uploadBox) {
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
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = function () {
          imagePreview.innerHTML = `<img src="${reader.result}" alt="Strap Image Preview" />`;
          uploadText.style.display = "none";
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // --- Run Inspection Button ---
  const runButton = document.querySelector(".run-btn");
  if (runButton) {
    runButton.addEventListener("click", function () {
      alert("Running inspection... (logic to be added)");
    });
  }
});
