document.getElementById('pairingForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const submitBtn = document.getElementById('submitBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultContainer = document.getElementById('resultContainer');
    const codeDisplay = document.getElementById('codeDisplay');

    if (!phoneNumber) {
        alert('Please enter a valid phone number.');
        return;
    }

    // UI State: Loading
    submitBtn.classList.add('hidden');
    resultContainer.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');

    try {
        // REPLACE THE URL BELOW with your actual deployed bot API endpoint (e.g., https://your-zcorpmd-app.onrender.com/pair?phone=...)
        const response = await fetch(`https://your-bot-backend-url.com/pair?phone=${encodeURIComponent(phoneNumber)}`);
        const data = await response.json();

        loadingSpinner.classList.add('hidden');
        submitBtn.classList.remove('hidden');

        if (data.code) {
            codeDisplay.textContent = data.code;
            resultContainer.classList.remove('hidden');
        } else {
            alert(data.error || 'Failed to generate pairing code. Please try again.');
        }
    } catch (error) {
        console.error('Error generating code:', error);
        loadingSpinner.classList.add('hidden');
        submitBtn.classList.remove('hidden');
        
        // Fallback simulation for testing UI flow if backend isn't linked yet
        // Remove this block once your backend route is live
        setTimeout(() => {
            codeDisplay.textContent = "ZCORP-99";
            resultContainer.classList.remove('hidden');
        }, 1000);
    }
});

// Copy Code Functionality
document.getElementById('copyBtn').addEventListener('click', function() {
    const codeText = document.getElementById('codeDisplay').textContent;
    navigator.clipboard.writeText(codeText).then(() => {
        const originalIcon = this.innerHTML;
        this.innerHTML = '<i class="fa-solid fa-check" style="color: #28a745;"></i>';
        setTimeout(() => {
            this.innerHTML = originalIcon;
        }, 2000);
    });
});
