// --- ID Tag Image Upload & Preview ---
const fileInput = document.getElementById('upload');
const previewImage = document.getElementById('preview-image');
const imagePreviewSection = document.querySelector('.image-preview');
const warningReasonSection = document.querySelector('.warning-reason-section');

fileInput.addEventListener('change', function() {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      previewImage.src = e.target.result;
      previewImage.style.display = 'block';
      imagePreviewSection.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
});

// --- Pass/Fail/Warning Buttons ---
document.getElementById('passButton').addEventListener('click', () => {
  if (warningReasonSection) warningReasonSection.style.display = 'none';
});

document.getElementById('failButton').addEventListener('click', () => {
  if (warningReasonSection) warningReasonSection.style.display = 'none';
});

document.getElementById('warningButton').addEventListener('click', () => {
  if (warningReasonSection) warningReasonSection.style.display = 'block';
});

// --- Damage Type Image Upload Buttons ---
const damageButtons = document.querySelectorAll('.damage-btn');
const damageUploads = document.querySelectorAll('.damage-upload');

damageButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    damageUploads[index].click(); // Open hidden file input
  });

  damageUploads[index].addEventListener('change', () => {
    if (damageUploads[index].files.length > 0) {
      button.classList.add('uploaded'); // Add style if files uploaded
    } else {
      button.classList.remove('uploaded'); // Remove style if no files
    }
  });
});
