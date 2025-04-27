// --- Registration Form Handling and Modal Popup ---

// Get form and modal elements
const registrationForm = document.getElementById('registrationForm');
const idModal = document.getElementById('idModal');
const generatedUserIdElement = document.getElementById('generatedUserId');
const setPasswordInput = document.getElementById('setPassword');
const confirmButton = document.getElementById('confirmRegistration');

// Function to generate a random User ID
function generateUserId() {
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  return `AST-${randomNumber}`;
}

// Handle form submission
registrationForm.addEventListener('submit', function(e) {
  e.preventDefault(); // Prevent page refresh

  // Generate User ID
  const userId = generateUserId();

  // Display User ID in the modal
  generatedUserIdElement.textContent = `User ID: ${userId}`;

  // Show the modal
  idModal.style.display = 'flex';
});

// Handle confirm button in the modal
confirmButton.addEventListener('click', function() {
  const password = setPasswordInput.value.trim();

  if (password.length < 6) {
    alert('Password must be at least 6 characters.');
    return;
  }

  // Here you would normally send the full registration data to the server
  console.log('Registration Complete!');
  console.log('Business Name:', document.getElementById('businessName').value);
  console.log('Full Name:', document.getElementById('fullName').value);
  console.log('Email Address:', document.getElementById('emailAddress').value);
  console.log('Position/Role:', document.getElementById('positionRole').value);
  console.log('Generated User ID:', generatedUserIdElement.textContent);
  console.log('Password Set:', password);

  // After successful registration - redirect to login page
  window.location.href = "index.html";
});
