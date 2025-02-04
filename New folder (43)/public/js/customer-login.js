document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.querySelector('input[name="password"]');
    const requirements = document.querySelector('.password-requirements');
    
    // Show requirements when password field is focused
    passwordInput.addEventListener('focus', () => {
        requirements.style.display = 'block';
    });
    
    // Hide requirements when password field loses focus
    passwordInput.addEventListener('blur', () => {
        if (passwordInput.value === '') {
            requirements.style.display = 'none';
        }
    });
    
    // Check password strength as user types
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        const hasLength = password.length >= 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        
        // Update requirement list items with checkmarks or x marks
        const items = requirements.querySelectorAll('li');
        items[0].innerHTML = `${hasLength ? '✓' : '✗'} Be at least 8 characters long`;
        items[1].innerHTML = `${hasUpper ? '✓' : '✗'} Include uppercase letters`;
        items[2].innerHTML = `${hasLower ? '✓' : '✗'} Include lowercase letters`;
        items[3].innerHTML = `${hasNumber ? '✓' : '✗'} Include numbers`;
    });
}); 