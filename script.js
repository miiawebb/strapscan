document.addEventListener('DOMContentLoaded', function() {
    // Get all the input elements
    const gvwInput = document.getElementById('gvw');
    const surfaceSelect = document.getElementById('surface');
    const slopeSelect = document.getElementById('slope');
    const damageSelect = document.getElementById('damage');
    const flatTiresInput = document.getElementById('flatTires');
    const unitToggle = document.getElementById('unitToggle');
    const weatherOptions = document.querySelectorAll('.weather-option');
    
    // Get all the result elements
    const surfaceResistanceResult = document.querySelector('#surfaceResistance .result-value');
    const slopeResistanceResult = document.querySelector('#slopeResistance .result-value');
    const damageResistanceResult = document.querySelector('#damageResistance .result-value');
    const weatherFactorResult = document.querySelector('#weatherFactor .result-value');
    const subtotalResult = document.querySelector('#subtotal .result-value');
    const errorFactorResult = document.querySelector('#errorFactor .result-value');
    const finalResult = document.getElementById('finalResult');
    const mbs3Result = document.getElementById('mbs3');
    const mbs5Result = document.getElementById('mbs5');
    
    // Get the detail tab elements
    const detailWeight = document.getElementById('detailWeight');
    const detailTerrain = document.getElementById('detailTerrain');
    const detailIncline = document.getElementById('detailIncline');
    const detailCondition = document.getElementById('detailCondition');
    const detailWeather = document.getElementById('detailWeather');
    const detailSubtotal = document.getElementById('detailSubtotal');
    const detailMargin = document.getElementById('detailMargin');
    const detailFinal = document.getElementById('detailFinal');
    
    // Get the buttons
    const calculateButton = document.getElementById('calculate');
    const resetButton = document.getElementById('reset');
    const printButton = document.getElementById('printResults');
    
    // Get modal elements
    const resultsModal = document.getElementById('resultsModal');
    const closeModalButton = document.getElementById('closeModal');
    const modalTabs = document.querySelectorAll('.modal-tab');
    const modalTabContents = document.querySelectorAll('.modal-tab-content');
    
    // Image upload elements
    const vehicleImageInput = document.getElementById('vehicleImage');
    const imagePreview = document.getElementById('imagePreview');
    const modalVehicleImage = document.getElementById('modalVehicleImage');
    const vehicleImageContainer = document.getElementById('vehicleImageContainer');
    
    // Set default weather option
    let currentWeatherFactor = 1.0;
    weatherOptions[0].classList.add('selected');
    
    // Add event listeners for weather options
    weatherOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            weatherOptions.forEach(opt => opt.classList.remove('selected'));
            // Add selected class to clicked option
            this.classList.add('selected');
            // Update weather factor
            currentWeatherFactor = parseFloat(this.getAttribute('data-value'));
            weatherFactorResult.textContent = currentWeatherFactor.toFixed(1) + '×';
            // Update calculations
            updateIndividualResults();
        });
    });
    
    // Add event listener for unit toggle
    unitToggle.addEventListener('change', function() {
        updateUnitDisplay();
        updateIndividualResults();
    });
    
    // Image upload handling
    vehicleImageInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                
                // Also update modal image
                modalVehicleImage.src = e.target.result;
                vehicleImageContainer.style.display = 'block';
            };
            
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    
    // Modal tab switching
    modalTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Update active tab
            modalTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Update active content
            modalTabContents.forEach(content => {
                content.classList.remove('active');
                content.style.display = 'none';
            });
            document.getElementById(tabName + 'Tab').classList.add('active');
            document.getElementById(tabName + 'Tab').style.display = 'block';
        });
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
    
    // Print results with proper tab handling
    printButton.addEventListener('click', function() {
        // Save current active tab
        const activeTab = document.querySelector('.modal-tab.active').getAttribute('data-tab');
        
        // Make all tabs visible for printing
        modalTabContents.forEach(function(content) {
            content.classList.add('active');
            content.style.display = 'block';
        });
        
        // Print the document
        window.print();
        
        // Reset the tabs after printing
        setTimeout(function() {
            modalTabContents.forEach(function(content) {
                content.classList.remove('active');
                content.style.display = 'none';
            });
            
            // Restore active tab
            document.querySelector('.modal-tab[data-tab="' + activeTab + '"]').classList.add('active');
            document.getElementById(activeTab + 'Tab').classList.add('active');
            document.getElementById(activeTab + 'Tab').style.display = 'block';
        }, 500);
    });
    
    // Function to update the displayed units (lbs or tons)
    function updateUnitDisplay() {
        const useTons = unitToggle.checked;
        const unit = useTons ? "tons" : "lbs";
        
        // Update input placeholder
        gvwInput.placeholder = `Enter weight in ${unit}`;
        
        // Update all displayed values
        updateIndividualResults();
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
        
        // Calculate flat tire damage
        let flatTireDamage = 0;
        if (flatTires > 0) {
            if (gvw <= 8000) {
                flatTireDamage = flatTires * 1000;
            } else {
                flatTireDamage = flatTires * 2000;
            }
        }
        
        // Calculate total damage resistance
        const damageResistance = (gvw * damageFactor) + flatTireDamage;
        
        // Calculate the subtotal (with weather factor)
        const subtotal = (surfaceResistance + slopeResistance + damageResistance) * currentWeatherFactor;
        
        // Calculate the error factor
        const errorFactor = subtotal * 1.25;
        
        // Update the individual results only
        surfaceResistanceResult.textContent = formatValueWithUnit(surfaceResistance, useTons);
        slopeResistanceResult.textContent = formatValueWithUnit(slopeResistance, useTons);
        damageResistanceResult.textContent = formatValueWithUnit(damageResistance, useTons);
        subtotalResult.textContent = formatValueWithUnit(subtotal, useTons);
        errorFactorResult.textContent = formatValueWithUnit(errorFactor, useTons);
    }
    
    // Function to calculate and show the final results
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
        
        // Calculate flat tire damage
        let flatTireDamage = 0;
        if (flatTires > 0) {
            if (gvw <= 8000) {
                flatTireDamage = flatTires * 1000;
            } else {
                flatTireDamage = flatTires * 2000;
            }
        }
        
        // Calculate total damage resistance
        const damageResistance = (gvw * damageFactor) + flatTireDamage;
        
        // Calculate the subtotal with weather factor
        const subtotal = (surfaceResistance + slopeResistance + damageResistance) * currentWeatherFactor;
        
        // Calculate the error factor
        const finalForce = subtotal * 1.25;
        
        // Calculate MBS values
        const mbs3 = finalForce * 3;
        const mbs5 = finalForce * 5;
        
        // Update the modal details tab
        detailWeight.textContent = formatValueWithUnit(gvw, useTons);
        detailTerrain.textContent = formatValueWithUnit(surfaceResistance, useTons);
        detailIncline.textContent = formatValueWithUnit(slopeResistance, useTons);
        detailCondition.textContent = formatValueWithUnit(damageResistance, useTons);
        detailWeather.textContent = currentWeatherFactor.toFixed(1) + '×';
        detailSubtotal.textContent = formatValueWithUnit(subtotal, useTons);
        detailMargin.textContent = formatValueWithUnit(finalForce - subtotal, useTons);
        detailFinal.textContent = formatValueWithUnit(finalForce, useTons);
        
        // Update the recommendations
        mbs3Result.textContent = formatValueWithUnit(mbs3, useTons);
        mbs5Result.textContent = formatValueWithUnit(mbs5, useTons);
        
        // Update the final result
        finalResult.textContent = formatValueWithUnit(finalForce, useTons);
        
        // Show the modal
        resultsModal.style.display = 'flex';
        
        // Reset to the summary tab
        modalTabs.forEach(t => t.classList.remove('active'));
        modalTabContents.forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });
        document.querySelector('.modal-tab[data-tab="summary"]').classList.add('active');
        document.getElementById('summaryTab').classList.add('active');
        document.getElementById('summaryTab').style.display = 'block';
    }
    
    // Function to reset the calculator
    function resetCalculator() {
        gvwInput.value = '';
        surfaceSelect.selectedIndex = 0;
        slopeSelect.selectedIndex = 0;
        damageSelect.selectedIndex = 0;
        flatTiresInput.value = '';
        
        // Reset weather option
        weatherOptions.forEach(opt => opt.classList.remove('selected'));
        weatherOptions[0].classList.add('selected');
        currentWeatherFactor = 1.0;
        weatherFactorResult.textContent = "1.0×";
        
        // Reset units to default (lbs)
        unitToggle.checked = false;
        updateUnitDisplay();
        
        // Reset image preview
        imagePreview.style.display = 'none';
        imagePreview.src = '';
        vehicleImageInput.value = '';
        
        // Reset result displays
        surfaceResistanceResult.textContent = "0 lbs";
        slopeResistanceResult.textContent = "0 lbs";
        damageResistanceResult.textContent = "0 lbs";
        subtotalResult.textContent = "0 lbs";
        errorFactorResult.textContent = "0 lbs";
        
        // Close the modal if open
        resultsModal.style.display = 'none';
    }
});
