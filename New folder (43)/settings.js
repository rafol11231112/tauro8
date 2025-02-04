document.addEventListener('DOMContentLoaded', function() {
    // Handle form submissions
    const forms = document.querySelectorAll('.settings-form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get all form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            // Save to localStorage (or send to server in production)
            for (let key in data) {
                localStorage.setItem(key, data[key]);
            }
            
            // Show success message
            alert('Settings saved successfully!');
        });
    });
    
    // Load saved settings
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        const savedValue = localStorage.getItem(input.name);
        if (savedValue) {
            input.value = savedValue;
        }
    });
}); 