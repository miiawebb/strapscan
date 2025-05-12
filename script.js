// Image upload functionality
const imageArrays = {};
const signaturePads = {};

// Set current date on form load
function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        input.value = today;
    });
}

// Initialize
window.onload = function() {
    setCurrentDate();
    
    // Delay initialization to ensure DOM is fully loaded
    setTimeout(initializeSignaturePads, 500);
    
    // Add event listeners for form visibility to reinitialize signature pads
    document.querySelectorAll('.inspection-card').forEach(card => {
        card.addEventListener('click', function() {
            // Delay to allow DOM updates
            setTimeout(initializeSignaturePads, 500);
        });
    });
};

// Signature pad initialization
function initializeSignaturePads() {
    const types = ['initial', 'frequent', 'periodic'];
    
    types.forEach(type => {
        const canvasElement = document.getElementById(`${type}-signature-pad`);
        
        if (canvasElement && canvasElement.getContext) {
            // Clear any existing signature pad instance
            if (signaturePads[type]) {
                signaturePads[type].off();
                delete signaturePads[type];
            }
            
            // Check if the form is visible before initializing
            const form = document.getElementById(`${type}Form`);
            if (form && form.style.display === 'block') {
                // Make sure canvas has correct dimensions
                canvasElement.width = canvasElement.offsetWidth;
                canvasElement.height = canvasElement.offsetHeight;
                
                // Create new signature pad
                signaturePads[type] = new SignaturePad(canvasElement, {
                    backgroundColor: 'rgb(255, 255, 255)',
                    penColor: 'rgb(0, 0, 0)',
                    velocityFilterWeight: 0.7
                });
                
                // Add touch event listeners for mobile
                canvasElement.addEventListener('touchstart', function(event) {
                    if (event.cancelable) {
                        event.preventDefault();
                    }
                }, { passive: false });
                
                canvasElement.addEventListener('touchmove', function(event) {
                    if (event.cancelable) {
                        event.preventDefault();
                    }
                }, { passive: false });
                
                // Resize canvas to parent container
                resizeCanvas(canvasElement, signaturePads[type]);
                
                console.log(`Signature pad initialized for ${type}`);
            }
        } else {
            console.error(`Canvas element not found or context not available for ${type}`);
        }
    });
    
    // Add resize listener
    window.addEventListener('resize', function() {
        types.forEach(type => {
            const canvasElement = document.getElementById(`${type}-signature-pad`);
            if (canvasElement && signaturePads[type]) {
                resizeCanvas(canvasElement, signaturePads[type]);
            }
        });
    });
}

// Resize the canvas to match its container
function resizeCanvas(canvas, signaturePad) {
    if (!canvas || !signaturePad) return;
    
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const container = canvas.parentElement;
    
    // Save signature data
    const data = signaturePad.toData();
    
    // Resize canvas
    canvas.width = container.offsetWidth * ratio;
    canvas.height = 200 * ratio; // Fixed height for consistency
    canvas.style.width = container.offsetWidth + 'px';
    canvas.style.height = '200px';
    
    // Scale context
    const context = canvas.getContext('2d');
    context.scale(ratio, ratio);
    
    // Clear and restore signature if data exists
    signaturePad.clear();
    if (data && data.length > 0) {
        signaturePad.fromData(data);
    }
}

// Clear signature
function clearSignature(type) {
    if (signaturePads[type]) {
        signaturePads[type].clear();
        console.log(`Cleared signature for ${type}`);
    } else {
        console.error(`Signature pad not found for ${type}`);
    }
}

// Navigation functions
function startInspection(type) {
    document.getElementById('homePage').style.display = 'none';
    document.getElementById(type + 'Form').style.display = 'block';
    setCurrentDate();
    
    // Initialize signature pad after the form is displayed
    setTimeout(() => {
        initializeSignaturePads();
        console.log(`Reinitialized signature pad after showing ${type}Form`);
    }, 300);
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
    
    // Check if signature is provided
    if (!formData.signature) {
        alert('Please provide a signature before generating the report.');
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
        images: imageArrays[type] || [],
        signature: signaturePads[type] && !signaturePads[type].isEmpty() ? signaturePads[type].toDataURL() : null
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
        content += `Service Type: ${data.selections['Service Type'] || ''}\n`;
    }
    
    content += `
        INSPECTION RESULTS
        ------------------
        Status: ${(data.status || '').toUpperCase()}
        
        INSPECTION DETAILS
        ------------------
    `;
    
    // Add all selections
    for (const [label, value] of Object.entries(data.selections)) {
        content += `${label}: ${value}\n`;
    }
    
    if (type === 'periodic' && data.frequency) {
        content += `\nRecommended Inspection Frequency: ${data.frequency}\n`;
    }
    
    if (data.comments) {
        content += `\nCOMMENTS/NOTES\n--------------\n${data.comments}\n`;
    }
    
    if (data.images && data.images.length > 0) {
        content += `\nPHOTO DOCUMENTATION\n------------------\n${data.images.length} photo(s) attached\n`;
    }
    
    if (data.signature) {
        content += `\nDIGITAL SIGNATURE\n-----------------\nDigitally signed by ${data.inspector}\n`;
    }
    
    content += `
        
        CONTACT INFORMATION
        -------------------
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

// Expose functions globally for onclick handlers to work
window.startInspection = startInspection;
window.goBack = goBack;
window.showResources = showResources;
window.uploadImage = uploadImage;
window.generatePDF = generatePDF;
window.removeImage = removeImage;
window.clearSignature = clearSignature;
