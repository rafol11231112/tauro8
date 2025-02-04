document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');

    // Get stored users or initialize empty array
    const getUsers = () => JSON.parse(localStorage.getItem('users') || '[]');
    const saveUsers = (users) => localStorage.setItem('users', JSON.stringify(users));

    // Toggle between login and register forms
    showRegister?.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    showLogin?.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    // Handle login
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.email.value.toLowerCase();
        const password = e.target.password.value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (data.success) {
                localStorage.setItem('customerLoggedIn', 'true');
                localStorage.setItem('customerEmail', email);
                localStorage.setItem('customerName', data.user.fullname);
                window.location.href = 'index.html';
            } else {
                alert(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    });

    // Handle registration
    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullname = e.target.fullname.value;
        const email = e.target.email.value.toLowerCase();
        const password = e.target.password.value;
        const confirmPassword = e.target.confirm_password.value;

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fullname, email, password })
            });

            const data = await response.json();
            if (data.success) {
                // Store user data
                const users = getUsers();
                users.push(data.user);
                saveUsers(users);

                // Auto login after registration
                localStorage.setItem('customerLoggedIn', 'true');
                localStorage.setItem('customerEmail', email);
                localStorage.setItem('customerName', fullname);
                
                alert('Registration successful!');
                window.location.href = 'index.html';
            } else {
                alert(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed. Please try again.');
        }
    });

    // Update verification button handlers
    const verifyBtn = document.querySelector('.verify-btn');
    const resendBtn = document.querySelector('.resend-btn');

    if (verifyBtn) {
        verifyBtn.addEventListener('click', async () => {
            const code = document.getElementById('verificationCode').value;
            if (!code) {
                alert('Please enter verification code');
                return;
            }

            try {
                const verifyResponse = await fetch('/api/auth/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: pendingEmail, code })
                });
                
                const verifyData = await verifyResponse.json();
                if (verifyData.success) {
                    localStorage.setItem('customerLoggedIn', 'true');
                    localStorage.setItem('customerEmail', pendingEmail);
                    localStorage.setItem('customerName', pendingFullname);
                    alert('Registration successful!');
                    window.location.href = returnUrl;
                } else {
                    alert(verifyData.message || 'Verification failed');
                }
            } catch (error) {
                alert('Verification failed. Please try again.');
            }
        });
    }

    if (resendBtn) {
        resendBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        email: pendingEmail, 
                        fullname: pendingFullname,
                        password: document.querySelector('#registerForm input[type="password"]').value
                    })
                });

                const data = await response.json();
                if (data.success) {
                    alert('New verification code sent to your email');
                } else {
                    alert(data.message);
                }
            } catch (error) {
                alert('Failed to resend code. Please try again.');
            }
        });
    }

    // Add password requirements
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        input.pattern = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$";
        input.title = "Password must be at least 8 characters long and include uppercase, lowercase, and numbers";
    });

    // Add this to handle the code inputs
    document.querySelectorAll('.code-input').forEach(input => {
        input.addEventListener('keyup', (e) => {
            if (e.key >= 0 && e.key <= 9) {
                const next = input.nextElementSibling;
                if (next && next.classList.contains('code-input')) {
                    next.focus();
                }
            } else if (e.key === 'Backspace') {
                const prev = input.previousElementSibling;
                if (prev && prev.classList.contains('code-input')) {
                    prev.focus();
                }
            }
            
            // Combine all inputs into hidden field
            const code = Array.from(document.querySelectorAll('.code-input'))
                .map(input => input.value)
                .join('');
            document.getElementById('verificationCode').value = code;
        });
    });
}); 