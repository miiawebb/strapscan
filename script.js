// --- ID Tag Image Upload & Preview ---
const fileInput = document.getElementById('upload');
const previewImage = document.getElementById('preview-image');
const imagePreviewSection = document.querySelector('.image-preview');

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

// --- Damage Type Image Upload Buttons ---
const damageButtons = document.querySelectorAll('.damage-btn');
const damageUploads = document.querySelectorAll('.damage-upload');

let uploadedDamages = []; // Track selected damages

damageButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    damageUploads[index].click();
  });

  damageUploads[index].addEventListener('change', () => {
    if (damageUploads[index].files.length > 0) {
      button.classList.add('uploaded');
      const damageType = button.getAttribute('data-damage');
      if (!uploadedDamages.includes(damageType)) {
        uploadedDamages.push(damageType);
      }
    } else {
      button.classList.remove('uploaded');
      const damageType = button.getAttribute('data-damage');
      uploadedDamages = uploadedDamages.filter(d => d !== damageType);
    }
  });
});

// --- Modal Handling ---
const modal = document.getElementById('resultModal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const confirmButton = document.getElementById('confirmResultButton');
const warningCommentSection = document.getElementById('warning-comment-section');
const warningCommentInput = document.getElementById('warningComment');

let currentResultType = ""; // Track whether Pass, Fail, Warning
let currentButtonClicked = null;

// Open modal function
function openModal(type, buttonElement) {
  currentResultType = type;
  currentButtonClicked = buttonElement;
  modal.style.display = 'flex';

  // Reset comment section
  warningCommentSection.style.display = 'none';
  warningCommentInput.value = '';

  if (type === 'pass') {
    modalTitle.textContent = 'Pass Inspection';
    modalMessage.textContent = 'a) Tag ID is compliant.\nb) No damage reported.\n\nPress Confirm to pass this inspection.';
  } else if (type === 'fail') {
    modalTitle.textContent = 'Fail Inspection';
    const damages = uploadedDamages.length > 0 ? uploadedDamages.join(', ') : 'No damage types selected';
    modalMessage.textContent = `a) Tag ID is compliant.\nb) Damage indicated: ${damages}.\n\nPress Confirm to fail this inspection.`;
  } else if (type === 'warning') {
    modalTitle.textContent = 'Warning Issued';
    modalMessage.textContent = 'a) Tag ID is compliant.\nb) Warning detected but not sufficient to fail inspection.\n\nPlease add any additional comments below then press Confirm.';
    warningCommentSection.style.display = 'block';
  }
}

// Confirm Modal
confirmButton.addEventListener('click', () => {
  if (currentResultType && currentButtonClicked) {
    if (currentResultType === 'pass') {
      currentButtonClicked.classList.add('pass-confirmed');
    } else if (currentResultType === 'fail') {
      currentButtonClicked.classList.add('fail-confirmed');
    } else if (currentResultType === 'warning') {
      currentButtonClicked.classList.add('warning-confirmed');
      const comment = warningCommentInput.value.trim();
      if (comment) {
        console.log('Warning Comment:', comment); // Save this later if needed
      }
    }
    modal.style.display = 'none';
  }
});

// --- Pass/Fail/Warning Button Listeners ---
document.getElementById('passButton').addEventListener('click', (e) => {
  openModal('pass', e.target);
});

document.getElementById('failButton').addEventListener('click', (e) => {
  openModal('fail', e.target);
});

document.getElementById('warningButton').addEventListener('click', (e) => {
  openModal('warning', e.target);
});
