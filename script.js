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
  // Collect selected data
  const selectedMaterial = document.querySelector("#materialGroup .selected")?.textContent || '';
  const selectedWidth = document.querySelector("#widthGroup .selected")?.textContent || '';
  const selectedInspectionType = document.querySelector(".toggle input:checked")?.id || '';
  
  // Collect image data (base64 string or file)
  const imageInput = document.getElementById("imageInput");
  const imageFile = imageInput.files[0];
  let imageData = '';
  if (imageFile) {
    const reader = new FileReader();
    reader.onloadend = function () {
      imageData = reader.result;
      sendInspectionData(selectedMaterial, selectedWidth, selectedInspectionType, imageData);
    };
    reader.readAsDataURL(imageFile);
  } else {
    // If no image is selected, trigger the inspection with empty data
    sendInspectionData(selectedMaterial, selectedWidth, selectedInspectionType, imageData);
  }
});

// Function to send data to the server
function sendInspectionData(material, width, inspectionType, imageData) {
  fetch('/api/inspect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      material: material,
      width: width,
      inspectionType: inspectionType,
      image: imageData,
    }),
  })
    .then(response => response.json())
    .then(result => {
      // Handle the result of the inspection here (e.g., show results)
      console.log(result);
      // Example: Display the result or update UI accordingly
      alert("Inspection complete!");
    })
    .catch(error => {
      console.error("Error during inspection:", error);
    });
}

