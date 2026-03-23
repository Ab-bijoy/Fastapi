// ============================================
// API Client — Centralized fetch + JWT handling
// ============================================

// For local development: set CONFIG.API_BASE to window.location.origin in config.js
// For production: set CONFIG.API_BASE to your Lambda URL in config.js
const API_BASE = CONFIG.API_BASE;

const api = {
    /** Get stored token */
    getToken() {
        return localStorage.getItem('token');
    },

    /** Save token */
    setToken(token) {
        localStorage.setItem('token', token);
    },

    /** Clear auth state */
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/static/index.html';
    },

    /** Get stored user info */
    getUser() {
        const u = localStorage.getItem('user');
        return u ? JSON.parse(u) : null;
    },

    /** Save user info */
    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },

    /** Redirect to login if not authenticated */
    requireAuth() {
        if (!this.getToken()) {
            window.location.href = '/static/index.html';
            return false;
        }
        return true;
    },

    /** Build headers */
    _headers(json = true) {
        const h = {};
        const token = this.getToken();
        if (token) h['Authorization'] = `Bearer ${token}`;
        if (json) h['Content-Type'] = 'application/json';
        return h;
    },

    /** Generic request */
    async _request(method, path, body = null, json = true) {
        const opts = {
            method,
            headers: this._headers(json),
            cache: 'no-cache', // Prevent the browser from caching GET requests
        };
        if (body && json) opts.body = JSON.stringify(body);
        if (body && !json) opts.body = body;

        const res = await fetch(`${API_BASE}${path}`, opts);

        if (res.status === 401) {
            this.logout();
            throw new Error('Session expired. Please login again.');
        }

        if (res.status === 204) return null;

        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: 'Something went wrong' }));
            throw new Error(err.detail || 'Request failed');
        }

        return res.json();
    },

    // ---- Auth ----
    async register(data) {
        return this._request('POST', '/auth/auth', data);
    },

    async login(username, password) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const res = await fetch(`${API_BASE}/auth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData,
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: 'Login failed' }));
            throw new Error(err.detail || 'Login failed');
        }

        const data = await res.json();
        this.setToken(data.access_token);
        return data;
    },

    // ---- Todos ----
    async getTodos() {
        return this._request('GET', '');
    },

    async getTodo(id) {
        return this._request('GET', `/todo/${id}`);
    },

    async createTodo(data) {
        return this._request('POST', '/todo', data);
    },

    async updateTodo(id, data) {
        return this._request('PUT', `/todo/${id}`, data);
    },

    async deleteTodo(id) {
        return this._request('DELETE', `/todo/${id}`);
    },

    // ---- User ----
    async getProfile() {
        return this._request('GET', '/user');
    },

    async updatePhone(phone_number) {
        return this._request('PUT', '/user/phone_number', { phone_number });
    },

    async updatePassword(password, new_password) {
        return this._request('PUT', '/user/password', { password, new_password });
    },

    // ---- Admin ----
    async adminGetTodos() {
        return this._request('GET', '/admin/todos');
    },

    async adminGetUsers() {
        return this._request('GET', '/admin/users');
    },

    async adminDeleteTodo(id) {
        return this._request('DELETE', `/admin/todos/${id}`);
    },
};

// ---- UI Helpers ----
function showAlert(id, message, type = 'error') {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = `alert alert-${type} show`;
    el.innerHTML = `<span>${type === 'error' ? '⚠' : '✓'}</span> ${message}`;
    if (type === 'success') {
        setTimeout(() => { el.classList.remove('show'); }, 3000);
    }
}

function hideAlert(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('show');
}

function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (loading) {
        btn.dataset.originalText = btn.innerHTML;
        btn.innerHTML = '<span class="loading-spinner"></span>';
        btn.disabled = true;
    } else {
        btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
        btn.disabled = false;
    }
}

/** Decode JWT payload (no verification, frontend-only) */
function decodeToken(token) {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
}

/** Populate the navbar with user info */
function initNavbar() {
    const user = api.getUser();
    const avatarEl = document.getElementById('nav-avatar');
    const usernameEl = document.getElementById('nav-username');
    const adminLink = document.getElementById('nav-admin');

    if (user) {
        if (avatarEl) avatarEl.textContent = (user.first_name || user.username || 'U')[0].toUpperCase();
        if (usernameEl) usernameEl.textContent = user.username || 'User';
        if (adminLink) {
            adminLink.style.display = user.role === 'admin' ? '' : 'none';
        }
    }
}
