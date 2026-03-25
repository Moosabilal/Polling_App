document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const errorMsg = document.getElementById('error-message');

    // If user is already logged in, redirect to dashboard
    if (localStorage.getItem('user')) {
        window.location.replace('./dashboard.html');
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.textContent = '';

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!email) {
            errorMsg.textContent = 'Email address is required.';
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            errorMsg.textContent = 'Please enter a valid email address.';
            return;
        }

        if (!password) {
            errorMsg.textContent = 'Password is required.';
            return;
        }

        try {
            // Use relative path for API calls
            const response = await fetch('./api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log('the data222', data)

            if (data.success && data.user) {
                // Save user detals
                localStorage.setItem('user', JSON.stringify(data.user));
                // Redirect
                window.location.replace('./dashboard.html');
            } else {
                errorMsg.textContent = data.message || 'Login failed. Please try again.';
            }
        } catch (err) {
            errorMsg.textContent = 'Network error. Could not connect to the server.';
            console.error(err);
        }
    });
});
