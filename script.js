// BUTTON SELECTIONS FOR WIDTH / MATERIAL
document.querySelectorAll("#materialGroup button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("#materialGroup button").forEach(btn => btn.classList.remove("selected"));
    button.classList.add("selected");
  });
});

document.querySelectorAll("#widthGroup button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("#widthGroup button").forEach(btn => btn.classList.remove("selected"));
    button.classList.add("selected");
  });
});

// TOGGLE SELECTION
document.querySelectorAll(".toggle input").forEach(input => {
  input.addEventListener("change", () => {
    const selectedLabel = document.querySelector(`.toggle label[for='${input.id}']`);
    selectedLabel.classList.add("selected");
    document.querySelectorAll(".toggle input").forEach(otherInput => {
      if (otherInput !== input) {
        const label = document.querySelector(`.toggle label[for='${otherInput.id}']`);
        label.classList.remove("selected");
      }
    });
  });
});

// IMAGE UPLOAD + PREVIEW
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

uploadBox.addEventListener("dragover", e => {
  e.preventDefault();
  uploadBox.style.borderColor = "#ff6600";
});

uploadBox.addEventListener("dragleave", e => {
  e.preventDefault();
  uploadBox.style.borderColor = "#aaa";
});

uploadBox.addEventListener("drop", e => {
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

// RUN INSPECTION
document.querySelector(".run-btn").addEventListener("click", async () => {
  const imageFile = imageInput.files[0];
  if (!imageFile) {
    alert("Please upload an image.");
    return;
  }

  const reader = new FileReader();
  reader.onloadend = async () => {
    const imageBase64 = reader.result;
    const width = document.querySelector("#widthGroup .selected")?.dataset.value;
    const material = document.querySelector("#materialGroup .selected")?.dataset.value;
    const inspectionType = document.getElementById("tagScan").checked ? "tag" : "quick";

    try {
      const res = await fetch("/api/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, material, width, inspectionType }),
      });

      const data = await res.json();
      const resultText = data.result;

      const resultBox = document.getElementById("inspectionResults");
      const message = document.getElementById("inspectionMessage");

      message.textContent = resultText;
      resultBox.style.display = "block";

      // Optional: Background color feedback based on result
      if (resultText.startsWith("→ PASS")) {
        resultBox.style.backgroundColor = "#e0f7e9";
      } else if (resultText.startsWith("→ FAIL")) {
        resultBox.style.backgroundColor = "#ffe0e0";
      } else if (resultText.startsWith("→ WARNING")) {
        resultBox.style.backgroundColor = "#fff3cd";
      }

    } catch (err) {
      console.error("Error during inspection:", err);
      alert("Inspection failed. Try again later.");
    }
  };
  reader.readAsDataURL(imageFile);
});
