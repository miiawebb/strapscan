// Navigation Functions
function showCalculator() {
    document.getElementById('landingPage').classList.remove('active');
    document.getElementById('calculatorPage').classList.add('active');
    document.getElementById('inspectionPage').classList.remove('active');
    window.scrollTo(0, 0); // Scroll to top
}

function showInspection() {
    document.getElementById('landingPage').classList.remove('active');
    document.getElementById('calculatorPage').classList.remove('active');
    document.getElementById('inspectionPage').classList.add('active');
    setCurrentDate();
    window.scrollTo(0, 0); // Scroll to top
}

function returnHome() {
  document.getElementById('landingPage').classList.add('active');
  document.getElementById('faqPage').classList.remove('active');
  document.getElementById('faqPage').classList.remove('active');
    document.getElementById('calculatorPage').classList.remove('active');
    document.getElementById('inspectionPage').classList.remove('active');
    window.scrollTo(0, 0); // Scroll to top
}

// Card expansion function
function toggleCard(card) {
    // Close all other cards first
    document.querySelectorAll('.tool-card').forEach(otherCard => {
        if (otherCard !== card && otherCard.classList.contains('expanded')) {
            otherCard.classList.remove('expanded');
        }
    });
    
    // Toggle the clicked card
    card.classList.toggle('expanded');
}

// ============== CALCULATOR FUNCTIONS ============== 
document.addEventListener('DOMContentLoaded', function() {
    // Get all the input elements
    const gvwInput = document.getElementById('gvw');
    const surfaceSelect = document.getElementById('surface');
    const slopeSelect = document.getElementById('slope');
    const damageSelect = document.getElementById('damage');
    const flatTiresInput = document.getElementById('flatTires');
    const unitToggle = document.getElementById('unitToggle');
    const inclineWarning = document.getElementById('inclineWarning');

    // Get all the result elements
    const surfaceResistanceResult = document.querySelector('#surfaceResistance .result-value');
    const slopeResistanceResult = document.querySelector('#slopeResistance .result-value');
    const damageResistanceResult = document.getElementById('damageResistance');
    const tireResistanceResult = document.getElementById('tireResistance');
    const subtotalResult = document.querySelector('#subtotal .result-value');
    const errorFactorResult = document.querySelector('#errorFactor .result-value');
    const finalResult = document.getElementById('finalResult');

    // Get the detail tab elements
    const detailWeight = document.getElementById('detailWeight');
    const detailSurface = document.getElementById('detailSurface');
    const detailSlope = document.getElementById('detailSlope');
    const detailDamage = document.getElementById('detailDamage');
    const detailTires = document.getElementById('detailTires');
    const detailSubtotal = document.getElementById('detailSubtotal');
    const detailError = document.getElementById('detailError');
    const detailFinal = document.getElementById('detailFinal');
    const detail3x = document.getElementById('detail3x');
    const detail5x = document.getElementById('detail5x');
    const safetyNote = document.getElementById('safetyNote');
    const safetyNoteText = document.getElementById('safetyNoteText');

    // Get the buttons
    const calculateButton = document.getElementById('calculate');
    const resetButton = document.getElementById('reset');

    // Get modal elements
    const resultsModal = document.getElementById('resultsModal');
    const closeModalButton = document.getElementById('closeModal');

    // Add event listener for unit toggle
    unitToggle.addEventListener('change', function() {
        updateUnitDisplay();
        updateIndividualResults();
    });

    // Add event listener for the slope warning
    slopeSelect.addEventListener('change', function() {
        const selectedValue = parseFloat(this.value) || 0;
        if (selectedValue >= 0.67) { // 40 degrees or higher
            inclineWarning.style.display = 'block';
        } else {
            inclineWarning.style.display = 'none';
        }
        updateIndividualResults();
    });

    // Close modal
    closeModalButton.addEventListener('click', function() {
        resultsModal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === resultsModal) {
            resultsModal.style.display = 'none';
        }
    });

    // Function to update the displayed units (lbs or tons)
    function updateUnitDisplay() {
        const useTons = unitToggle.checked;
        const unit = useTons ? "tons" : "lbs";
        // Update input placeholder
        gvwInput.placeholder = `Enter weight in ${unit}`;
        flatTiresInput.placeholder = "Number of flat tires";
        // Update all displayed values
        updateIndividualResults();
    }

    // Function to round to nearest 10k based on the rule
    function roundToNearest10k(value) {
        const remainder = value % 10000;
        if (remainder >= 5000) {
            return value + (10000 - remainder);
        } else {
            return value - remainder;
        }
    }

    // Function to convert between pounds and tons
    function formatValueWithUnit(value, useTons = false) {
        if (useTons) {
            return (value / 2000).toLocaleString(undefined, {maximumFractionDigits: 2}) + " tons";
        } else {
            return Math.round(value).toLocaleString() + " lbs";
        }
    }

    // Add event listeners for real-time updating of individual sections
    gvwInput.addEventListener('input', updateIndividualResults);
    surfaceSelect.addEventListener('change', updateIndividualResults);
    slopeSelect.addEventListener('change', updateIndividualResults);
    damageSelect.addEventListener('change', updateIndividualResults);
    flatTiresInput.addEventListener('input', updateIndividualResults);

    // Add event listener to the calculate button
    calculateButton.addEventListener('click', calculateFinalResults);

    // Add event listener to the reset button
    resetButton.addEventListener('click', resetCalculator);

    // Function to update individual section results in real-time
    function updateIndividualResults() {
        // Get the values from the inputs
        let gvw = parseFloat(gvwInput.value) || 0;
        const useTons = unitToggle.checked;

        // Convert to pounds if input is in tons
        if (useTons) {
            gvw = gvw * 2000;
        }

        const surfaceFactor = parseFloat(surfaceSelect.value) || 0;
        const slopeFactor = parseFloat(slopeSelect.value) || 0;
        const damageFactor = parseFloat(damageSelect.value) || 0;
        const flatTires = parseInt(flatTiresInput.value) || 0;

        // Calculate the resistances
        const surfaceResistance = gvw * surfaceFactor;
        const slopeResistance = gvw * slopeFactor;
        const damageResistance = gvw * damageFactor;

        // Calculate tire resistance based on GVW
        let tireResistancePerTire;
        if (gvw <= 8000) {
            tireResistancePerTire = 1000;
        } else {
            tireResistancePerTire = 2000;
        }
        const totalTireResistance = flatTires * tireResistancePerTire;

        // Calculate the subtotal (Steps 2-4 INCLUDING flat tires)
        const subtotal = surfaceResistance + slopeResistance + damageResistance + totalTireResistance;

        // Calculate with safety margin (25% of subtotal including flat tires)
        const errorFactor = subtotal * 0.25;
        const withError = subtotal + errorFactor;

        // Update the individual results only
        surfaceResistanceResult.textContent = formatValueWithUnit(surfaceResistance, useTons);
        slopeResistanceResult.textContent = formatValueWithUnit(slopeResistance, useTons);
        damageResistanceResult.textContent = formatValueWithUnit(damageResistance, useTons);
        tireResistanceResult.textContent = formatValueWithUnit(totalTireResistance, useTons);
        subtotalResult.textContent = formatValueWithUnit(subtotal, useTons);
        errorFactorResult.textContent = formatValueWithUnit(withError, useTons);
    }

    function calculateFinalResults() {
        // Get the values from the inputs
        let gvw = parseFloat(gvwInput.value) || 0;
        const useTons = unitToggle.checked;

        // Convert to pounds if input is in tons
        if (useTons) {
            gvw = gvw * 2000;
        }

        const surfaceFactor = parseFloat(surfaceSelect.value) || 0;
        const slopeFactor = parseFloat(slopeSelect.value) || 0;
        const damageFactor = parseFloat(damageSelect.value) || 0;
        const flatTires = parseInt(flatTiresInput.value) || 0;

        // Calculate the resistances
        const surfaceResistance = gvw * surfaceFactor;
        const slopeResistance = gvw * slopeFactor;
        const damageResistance = gvw * damageFactor;

        // Calculate tire resistance based on GVW
        let tireResistancePerTire;
        if (gvw <= 8000) {
            tireResistancePerTire = 1000;
        } else {
            tireResistancePerTire = 2000;
        }
        const totalTireResistance = flatTires * tireResistancePerTire;

        // Calculate the subtotal (Steps 2-4 INCLUDING flat tires)
        const subtotal = surfaceResistance + slopeResistance + damageResistance + totalTireResistance;

        // Calculate error factor (25% of subtotal)
        const errorFactor = subtotal * 0.25;

        // Calculate final WLL (Subtotal + Error Factor)
        const finalWLL = subtotal + errorFactor;

        // Calculate safety factors
        const calculated3x = finalWLL * 3;
        const calculated5x = finalWLL * 5;
        const minimum3x = gvw * 3;
        const minimum5x = gvw * 5;

        // Apply the MAX rule for safety factors
        const recommended3x = Math.max(calculated3x, minimum3x);
        const recommended5x = Math.max(calculated5x, minimum5x);

        // Debug logging
        console.log('GVW:', gvw);
        console.log('Final WLL:', finalWLL);
        console.log('Calculated 3x:', calculated3x);
        console.log('Minimum 3x:', minimum3x);
        console.log('Recommended 3x:', recommended3x);
        console.log('Calculated 5x:', calculated5x);
        console.log('Minimum 5x:', minimum5x);
        console.log('Recommended 5x:', recommended5x);

        // Check if we needed to bump up the values
        let needsSafetyNote = false;
        let noteText = "";
        if (recommended3x > calculated3x || recommended5x > calculated5x) {
            needsSafetyNote = true;
            noteText = `The calculated WLL (${formatValueWithUnit(finalWLL, useTons)}) produces safety factors below industry minimums. Recommendations have been adjusted to meet the minimum requirements of 3:1 and 5:1 based on GVW.`;
        }

        // Update the modal details
        detailWeight.textContent = formatValueWithUnit(gvw, useTons);
        detailSurface.textContent = formatValueWithUnit(surfaceResistance, useTons);
        detailSlope.textContent = formatValueWithUnit(slopeResistance, useTons);
        detailDamage.textContent = formatValueWithUnit(damageResistance, useTons);
        detailTires.textContent = formatValueWithUnit(totalTireResistance, useTons);
        detailSubtotal.textContent = formatValueWithUnit(subtotal, useTons);
        detailError.textContent = formatValueWithUnit(errorFactor, useTons);
        detailFinal.textContent = formatValueWithUnit(finalWLL, useTons);

        // Check if elements exist before updating and round the values
        if (detail3x) {
            let displayValue = recommended3x;
            // Only round if the calculated WLL was higher than the minimum
            if (calculated3x > minimum3x) {
                displayValue = roundToNearest10k(recommended3x);
            }
            detail3x.textContent = formatValueWithUnit(displayValue, useTons);
        }

        if (detail5x) {
            let displayValue = recommended5x;
            // Only round if the calculated WLL was higher than the minimum
            if (calculated5x > minimum5x) {
                displayValue = roundToNearest10k(recommended5x);
            }
            detail5x.textContent = formatValueWithUnit(displayValue, useTons);
        }

        // Update the final result (use the calculated WLL for display)
        finalResult.textContent = formatValueWithUnit(finalWLL, useTons);

        // Show/hide safety note
        if (needsSafetyNote && safetyNote && safetyNoteText) {
            safetyNote.style.display = 'block';
            safetyNoteText.textContent = noteText;
        } else if (safetyNote) {
            safetyNote.style.display = 'none';
        }

        // Show the modal
        resultsModal.style.display = 'flex';
    }

    // Function to reset the calculator
    function resetCalculator() {
        gvwInput.value = '';
        surfaceSelect.selectedIndex = 0;
        slopeSelect.selectedIndex = 0;
        damageSelect.selectedIndex = 0;
        flatTiresInput.value = '0';

        // Reset units to default (lbs)
        unitToggle.checked = false;
        updateUnitDisplay();

        // Reset result displays
        surfaceResistanceResult.textContent = "0 lbs";
        slopeResistanceResult.textContent = "0 lbs";
        damageResistanceResult.textContent = "0 lbs";
        tireResistanceResult.textContent = "0 lbs";
        subtotalResult.textContent = "0 lbs";
        errorFactorResult.textContent = "0 lbs";

        // Hide warning
        inclineWarning.style.display = 'none';

        // Close the modal if open
        resultsModal.style.display = 'none';
    }

    // Scroll animations
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });

    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetElement = document.querySelector(this.getAttribute('href'));
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});


function showFAQ() {
  document.getElementById('landingPage').classList.remove('active');
  document.getElementById('calculatorPage').classList.remove('active');
  document.getElementById('inspectionPage').classList.remove('active');
  document.getElementById('faqPage').classList.add('active');
  window.scrollTo(0, 0);
}


// ============== INSPECTION FUNCTIONS ============== 

// Image upload functionality
const imageArrays = {};

// Set current date on form load
function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        input.value = today;
    });
}

// Navigation functions
function startInspection(type) {
    document.getElementById('homePage').style.display = 'none';
    document.getElementById(type + 'Form').style.display = 'block';
    setCurrentDate();
}

function showResources() {
    document.getElementById('homePage').style.display = 'none';
    document.getElementById('resourcesPage').style.display = 'block';
}

function goBack() {
    document.querySelectorAll('.inspection-form').forEach(form => {
        form.style.display = 'none';
    });
    document.getElementById('homePage').style.display = 'block';
}

// Image upload functions
function uploadImage(inspectionType, useCamera) {
    const inputId = `${inspectionType}-${useCamera ? 'camera' : 'file'}`;
    const input = document.getElementById(inputId);
    input.click();
    input.onchange = function(e) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const key = inspectionType;
            if (!imageArrays[key]) {
                imageArrays[key] = [];
            }

            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = function(event) {
                    imageArrays[key].push({
                        data: event.target.result,
                        name: file.name,
                        type: file.type
                    });
                    displayImagePreview(inspectionType, event.target.result);
                };
                reader.readAsDataURL(file);
            });
        }
        // Reset input
        e.target.value = '';
    };
}

function displayImagePreview(inspectionType, imageSrc) {
    const previewContainer = document.getElementById(`${inspectionType}-preview`);
    const imagePreview = document.createElement('div');
    imagePreview.className = 'image-preview';
    imagePreview.innerHTML = `
        <img src="${imageSrc}" alt="Inspection photo">
        <button class="remove-image" onclick="removeImage(this, '${inspectionType}', '${imageSrc}')">
            <i class="fas fa-times"></i>
        </button>
    `;
    previewContainer.appendChild(imagePreview);
}

function removeImage(button, inspectionType, imageSrc) {
    const key = inspectionType;
    if (imageArrays[key]) {
        imageArrays[key] = imageArrays[key].filter(img => img.data !== imageSrc);
    }
    button.parentElement.remove();
}

// PDF Generation function
function generatePDF(type) {
    // Collect form data based on inspection type
    const formData = collectFormData(type);
    if (!validateForm(type)) {
        alert('Please complete all required fields before generating the report.');
        return;
    }

    // Create PDF content
    const pdfContent = generatePDFContent(type, formData);

    // Trigger download
    downloadPDF(pdfContent, type);
}

function collectFormData(type) {
    const data = {
        inspector: document.getElementById(type + '-inspector').value,
        date: document.getElementById(type + '-date').value,
        strapId: document.getElementById(type + '-strap-id').value,
        status: document.querySelector(`input[name="${type}-status"]:checked`)?.value,
        comments: document.getElementById(type + '-comments').value,
        selections: {},
        images: imageArrays[type] || []
    };

    // Collect all select values for the specific form
    document.querySelectorAll(`#${type}Form select`).forEach(select => {
        if (select.value) {
            const label = select.previousElementSibling.textContent.trim();
            data.selections[label] = select.selectedOptions[0].text;
        }
    });

    // Add specific fields for periodic inspection
    if (type === 'periodic') {
        data.serviceType = document.getElementById('periodic-service-type').value;
        data.frequency = document.getElementById('periodic-frequency').value;
    }

    return data;
}

function validateForm(type) {
    const inspector = document.getElementById(type + '-inspector').value;
    const strapId = document.getElementById(type + '-strap-id').value;
    const status = document.querySelector(`input[name="${type}-status"]:checked`);

    if (!inspector || !strapId || !status) {
        return false;
    }

    // Check that all required dropdowns are selected
    const requiredSelects = document.querySelectorAll(`#${type}Form select[required]`);
    for (let select of requiredSelects) {
        if (!select.value) {
            return false;
        }
    }

    return true;
}

function generatePDFContent(type, data) {
    const date = new Date().toLocaleDateString();
    const inspectionType = type.charAt(0).toUpperCase() + type.slice(1);

    let content = `

TOW STRAP INSPECTION REPORT

Inspection Type: ${inspectionType} Inspection
Generated Date: ${date}

GENERAL INFORMATION
-------------------
Inspector Name: ${data.inspector}
Inspection Date: ${data.date}
Strap ID/Serial Number: ${data.strapId}
`;

    if (type === 'periodic') {
        content += `Service Type: ${data.serviceType}n`;
    }

    content += `

INSPECTION RESULTS
-----------------
Status: ${(data.status || '').toUpperCase()}

INSPECTION DETAILS
-----------------
`;

    // Add all selections
    for (const [label, value] of Object.entries(data.selections)) {
        content += `${label}: ${value}n`;
    }

    if (type === 'periodic' && data.frequency) {
        content += `nRecommended Inspection Frequency: ${data.frequency}n`;
    }

    if (data.comments) {
        content += `nCOMMENTS/NOTESn--------------n${data.comments}n`;
    }

    if (data.images && data.images.length > 0) {
        content += `nPHOTO DOCUMENTATIONn------------------n${data.images.length} photo(s) attachedn`;
    }

    content += `

CONTACT INFORMATION
------------------
Dawnerz
Phone: 814-300-8032
Email: info@dawnerz.com
Website: dawnerz.com

© 2025 Dawnerz. All rights reserved.
`;

    return content;
}

function downloadPDF(content, type) {
    // Create a simple text file (in a real implementation, you'd use a PDF library)
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inspection-report-${type}-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    // Show success message
    alert('Inspection report downloaded successfully!');
}

function toggleAccordion(header) {
  const body = header.nextElementSibling;
  const isActive = header.classList.contains('active');
  document.querySelectorAll('.accordion-body').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.accordion-header').forEach(el => el.classList.remove('active'));
  if (!isActive) {
    header.classList.add('active');
    body.style.display = 'block';
  }
}
