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
    }
    reader.readAsDataURL(file);
  }
});

// Handle Warning Reason Show/Hide
document.getElementById('passButton').addEventListener('click', () => {
  warningReasonSection.style.display = 'none';
});

document.getElementById('failButton').addEventListener('click', () => {
  warningReasonSection.style.display = 'none';
});

document.getElementById('warningButton').addEventListener('click', () => {
  warningReasonSection.style.display = 'block';
});
