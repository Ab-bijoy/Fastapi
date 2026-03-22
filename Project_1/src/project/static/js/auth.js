// ============================================
// Auth page logic — Login & Register
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect
    if (api.getToken()) {
        window.location.href = '/static/dashboard.html';
        return;
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideAlert('auth-alert');

            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;

            if (!username || !password) {
                showAlert('auth-alert', 'Please fill in all fields');
                return;
            }

            setLoading('login-btn', true);

            try {
                await api.login(username, password);

                // Fetch profile to store user info
                const profile = await api.getProfile();
                api.setUser(profile);

                window.location.href = '/static/dashboard.html';
            } catch (err) {
                showAlert('auth-alert', err.message);
            } finally {
                setLoading('login-btn', false);
            }
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideAlert('auth-alert');

            const data = {
                username: document.getElementById('reg-username').value.trim(),
                email: document.getElementById('reg-email').value.trim(),
                first_name: document.getElementById('reg-firstname').value.trim(),
                last_name: document.getElementById('reg-lastname').value.trim(),
                password: document.getElementById('reg-password').value,
                role: document.getElementById('reg-role').value,
            };

            const confirmPassword = document.getElementById('reg-confirm-password').value;

            if (Object.values(data).some(v => !v)) {
                showAlert('auth-alert', 'Please fill in all fields');
                return;
            }

            if (data.password !== confirmPassword) {
                showAlert('auth-alert', 'Passwords do not match');
                return;
            }

            if (data.password.length < 3) {
                showAlert('auth-alert', 'Password must be at least 3 characters');
                return;
            }

            setLoading('register-btn', true);

            try {
                await api.register(data);
                showAlert('auth-alert', 'Account created! Redirecting to login...', 'success');
                setTimeout(() => {
                    window.location.href = '/static/index.html';
                }, 1500);
            } catch (err) {
                showAlert('auth-alert', err.message);
            } finally {
                setLoading('register-btn', false);
            }
        });
    }
});
