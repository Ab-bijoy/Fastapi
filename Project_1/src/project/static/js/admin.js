// ============================================
// Admin panel logic
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    if (!api.requireAuth()) return;
    initNavbar();

    // Check admin role
    const user = api.getUser();
    if (!user || user.role !== 'admin') {
        document.querySelector('.app-container').innerHTML = `
            <div class="empty-state" style="padding-top:6rem">
                <div class="empty-state-icon">🔒</div>
                <h3>Access Denied</h3>
                <p>You need admin privileges to view this page.</p>
                <a href="/static/dashboard.html" class="btn btn-primary">Back to Dashboard</a>
            </div>`;
        return;
    }

    setupTabs();
    loadAdminUsers();
    loadAdminTodos();
});

function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });
}

async function loadAdminUsers() {
    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem"><span class="loading-spinner"></span></td></tr>';

    try {
        const users = await api.adminGetUsers();
        document.getElementById('admin-users-count').textContent = users.length;

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted)">No users found</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(u => `
            <tr>
                <td><strong>${escapeHtml(u.username)}</strong></td>
                <td>${escapeHtml(u.email || '—')}</td>
                <td>${escapeHtml(u.first_name || '')} ${escapeHtml(u.last_name || '')}</td>
                <td><span class="role-badge ${u.role}">${u.role}</span></td>
                <td>${u.is_active
                    ? '<span class="status-dot active"></span>Active'
                    : '<span class="status-dot inactive"></span>Inactive'}</td>
                <td>${u.phone_number || '—'}</td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--accent-red)">${err.message}</td></tr>`;
    }
}

async function loadAdminTodos() {
    const tbody = document.getElementById('todos-tbody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem"><span class="loading-spinner"></span></td></tr>';

    try {
        const todos = await api.adminGetTodos();
        document.getElementById('admin-todos-count').textContent = todos.length;

        if (todos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted)">No todos found</td></tr>';
            return;
        }

        tbody.innerHTML = todos.map(t => `
            <tr>
                <td>#${t.id}</td>
                <td><strong>${escapeHtml(t.title)}</strong><br><small style="color:var(--text-muted)">${escapeHtml(t.description)}</small></td>
                <td><span class="priority-badge" style="background:${priorityBg(t.priority)};color:${priorityColor(t.priority)}">P${t.priority}</span></td>
                <td>${t.completed ? '✅ Done' : '⏳ Pending'}</td>
                <td>User #${t.owner_id}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="adminDeleteTodo(${t.id})">Delete</button>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--accent-red)">${err.message}</td></tr>`;
    }
}

async function adminDeleteTodo(id) {
    if (!confirm('Permanently delete this todo?')) return;

    try {
        await api.adminDeleteTodo(id);
        await loadAdminTodos();
    } catch (err) {
        alert(err.message);
    }
}

function priorityBg(p) {
    const map = { 1: 'rgba(16,185,129,0.15)', 2: 'rgba(59,130,246,0.15)', 3: 'rgba(245,158,11,0.15)', 4: 'rgba(249,115,22,0.15)', 5: 'rgba(239,68,68,0.15)' };
    return map[p] || map[3];
}

function priorityColor(p) {
    const map = { 1: '#10b981', 2: '#3b82f6', 3: '#f59e0b', 4: '#f97316', 5: '#ef4444' };
    return map[p] || map[3];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}
