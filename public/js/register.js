document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    const errorMsg = document.getElementById('error-message');

    if (localStorage.getItem('user')) {
        window.location.replace('./dashboard.html');
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.textContent = '';

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirm-password').value.trim();

        if (!name) {
            errorMsg.textContent = 'Full Name is required.';
            return;
        }

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

        if (password.length < 6) {
            errorMsg.textContent = 'Password must be at least 6 characters long.';
            return;
        }

        if (!confirmPassword) {
            errorMsg.textContent = 'Please confirm your password.';
            return;
        }

        if (password !== confirmPassword) {
            errorMsg.textContent = 'Passwords do not match.';
            return;
        }

        try {
            const response = await fetch('./api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (data.success && data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.replace('./dashboard.html');
            } else {
                errorMsg.textContent = data.message || 'Registration failed.';
            }
        } catch (err) {
            errorMsg.textContent = 'Network error. Could not connect to the server.';
            console.error(err);
        }
    });
});
