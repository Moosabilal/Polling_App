document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const errorMsg = document.getElementById('error-message');

    // If user is already logged in, redirect to dashboard
    if (localStorage.getItem('user')) {
        window.location.href = './dashboard.html';
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.textContent = '';

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!email || !password) {
            errorMsg.textContent = 'Please enter both email and password';
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
                window.location.href = './dashboard.html';
            } else {
                errorMsg.textContent = data.message || 'Login failed. Please try again.';
            }
        } catch (err) {
            errorMsg.textContent = 'Network error. Could not connect to the server.';
            console.error(err);
        }
    });
});
