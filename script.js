const fileInput = document.getElementById('upload');
const previewImage = document.getElementById('preview-image');
const imagePreviewSection = document.querySelector('.image-preview');
const warningReasonSection = document.querySelector('.warning-reason-section');

// Preview for ID Tag Upload
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

// Show/hide warning reason
document.getElementById('passButton').addEventListener('click', () => {
  if (warningReasonSection) warningReasonSection.style.display = 'none';
});
document.getElementById('failButton').addEventListener('click', () => {
  if (warningReasonSection) warningReasonSection.style.display = 'none';
});
document.getElementById('warningButton').addEventListener('click', () => {
  if (warningReasonSection) warningReasonSection.style.display = 'block';
});

// New: Handle Damage Type Image Uploads
const damageButtons = document.querySelectorAll('.damage-btn');
const damageUploads = document.querySelectorAll('.damage-upload');

damageButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    damageUploads[index].click(); // Trigger hidden input when button clicked
  });
});
