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
      uploadText.style.display = "none"; // Hide the upload text after image is added
    };
    reader.readAsDataURL(file);
  }
});

// Run Inspection button click logic
const runButton = document.querySelector(".run-btn");
runButton.addEventListener("click", function () {
  // You can add your logic for running the inspection here, such as sending data to the server or processing the inputs
  alert("Running inspection... (logic to be added)");
});
