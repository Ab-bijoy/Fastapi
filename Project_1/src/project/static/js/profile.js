// ============================================
// Profile page logic
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    if (!api.requireAuth()) return;
    initNavbar();
    loadProfile();
    setupProfileEvents();
});

async function loadProfile() {
    try {
        const user = await api.getProfile();
        api.setUser(user);

        // Avatar
        const initials = ((user.first_name?.[0] || '') + (user.last_name?.[0] || '')).toUpperCase() || 'U';
        document.getElementById('profile-avatar').textContent = initials;

        // Header
        document.getElementById('profile-name').textContent = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
        document.getElementById('profile-email').textContent = user.email || '';
        document.getElementById('profile-role-badge').textContent = user.role || 'user';
        document.getElementById('profile-role-badge').className = `role-badge ${user.role || 'user'}`;

        // Info rows
        document.getElementById('info-username').textContent = user.username || '—';
        document.getElementById('info-email').textContent = user.email || '—';
        document.getElementById('info-firstname').textContent = user.first_name || '—';
        document.getElementById('info-lastname').textContent = user.last_name || '—';
        document.getElementById('info-phone').textContent = user.phone_number || 'Not set';
        document.getElementById('info-status').innerHTML = user.is_active
            ? '<span class="status-dot active"></span>Active'
            : '<span class="status-dot inactive"></span>Inactive';

        // Pre-fill phone field
        document.getElementById('phone-input').value = user.phone_number || '';
    } catch (err) {
        showAlert('profile-alert', err.message);
    }
}

function setupProfileEvents() {
    // Phone form
    document.getElementById('phone-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert('phone-alert');

        const phone = document.getElementById('phone-input').value.trim();
        if (!phone) {
            showAlert('phone-alert', 'Please enter a phone number');
            return;
        }

        setLoading('phone-btn', true);
        try {
            await api.updatePhone(phone);
            showAlert('phone-alert', 'Phone number updated!', 'success');
            await loadProfile();
        } catch (err) {
            showAlert('phone-alert', err.message);
        } finally {
            setLoading('phone-btn', false);
        }
    });

    // Password form
    document.getElementById('password-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert('password-alert');

        const current = document.getElementById('current-password').value;
        const newPass = document.getElementById('new-password').value;
        const confirm = document.getElementById('confirm-new-password').value;

        if (!current || !newPass || !confirm) {
            showAlert('password-alert', 'Please fill in all fields');
            return;
        }

        if (newPass !== confirm) {
            showAlert('password-alert', 'New passwords do not match');
            return;
        }

        if (newPass.length < 6) {
            showAlert('password-alert', 'New password must be at least 6 characters');
            return;
        }

        setLoading('password-btn', true);
        try {
            await api.updatePassword(current, newPass);
            showAlert('password-alert', 'Password changed successfully!', 'success');
            document.getElementById('password-form').reset();
        } catch (err) {
            showAlert('password-alert', err.message);
        } finally {
            setLoading('password-btn', false);
        }
    });
}
