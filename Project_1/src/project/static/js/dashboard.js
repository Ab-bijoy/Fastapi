// ============================================
// Dashboard — Todo CRUD
// ============================================

let allTodos = [];
let currentFilter = 'all';
let editingTodoId = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!api.requireAuth()) return;
    initNavbar();
    loadTodos();
    setupEventListeners();
});

async function loadTodos() {
    const container = document.getElementById('todo-list');
    container.innerHTML = `
        <div class="empty-state">
            <div class="loading-spinner" style="width:32px;height:32px;border-width:3px;margin:0 auto 1rem"></div>
            <p>Loading your todos...</p>
        </div>`;

    try {
        allTodos = await api.getTodos();
        renderTodos();
        updateStats();
    } catch (err) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠</div>
                <h3>Failed to load todos</h3>
                <p>${err.message}</p>
                <button class="btn btn-primary" onclick="loadTodos()">Retry</button>
            </div>`;
    }
}

function renderTodos() {
    const container = document.getElementById('todo-list');
    const searchTerm = (document.getElementById('search-input')?.value || '').toLowerCase();

    let filtered = [...allTodos];

    // Filter
    if (currentFilter === 'active') filtered = filtered.filter(t => !t.completed);
    else if (currentFilter === 'completed') filtered = filtered.filter(t => t.completed);

    // Search
    if (searchTerm) {
        filtered = filtered.filter(t =>
            t.title.toLowerCase().includes(searchTerm) ||
            t.description.toLowerCase().includes(searchTerm)
        );
    }

    // Sort: incomplete first, then by priority desc
    filtered.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return b.priority - a.priority;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <h3>${allTodos.length === 0 ? 'No todos yet' : 'No matching todos'}</h3>
                <p>${allTodos.length === 0 ? 'Create your first todo to get started!' : 'Try a different search or filter.'}</p>
                ${allTodos.length === 0 ? '<button class="btn btn-primary" onclick="openModal()">+ Add Todo</button>' : ''}
            </div>`;
        return;
    }

    const priorityLabels = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Urgent', 5: 'Critical' };

    container.innerHTML = filtered.map(todo => `
        <div class="todo-item priority-${todo.priority} ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
            <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" onclick="toggleTodo(${todo.id})" title="Toggle complete">
                ${todo.completed ? '✓' : ''}
            </div>
            <div class="todo-content">
                <div class="todo-title">${escapeHtml(todo.title)}</div>
                <div class="todo-description">${escapeHtml(todo.description)}</div>
            </div>
            <div class="todo-meta">
                <span class="priority-badge">P${todo.priority} · ${priorityLabels[todo.priority] || ''}</span>
            </div>
            <div class="todo-actions">
                <button class="btn btn-ghost btn-icon" onclick="editTodo(${todo.id})" title="Edit">✎</button>
                <button class="btn btn-ghost btn-icon" onclick="deleteTodo(${todo.id})" title="Delete" style="color:var(--accent-red)">✕</button>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    const total = allTodos.length;
    const completed = allTodos.filter(t => t.completed).length;
    const active = total - completed;
    const highPriority = allTodos.filter(t => t.priority >= 4 && !t.completed).length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-active').textContent = active;
    document.getElementById('stat-completed').textContent = completed;
    document.getElementById('stat-high').textContent = highPriority;
}

function setupEventListeners() {
    // Search
    document.getElementById('search-input')?.addEventListener('input', renderTodos);

    // Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTodos();
        });
    });

    // Modal form
    document.getElementById('todo-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert('modal-alert');

        const data = {
            title: document.getElementById('todo-title').value.trim(),
            description: document.getElementById('todo-desc').value.trim(),
            priority: parseInt(document.getElementById('todo-priority').value),
            completed: document.getElementById('todo-completed')?.checked || false,
        };

        if (!data.title || !data.description) {
            showAlert('modal-alert', 'Title and description are required');
            return;
        }

        setLoading('save-todo-btn', true);

        try {
            if (editingTodoId) {
                await api.updateTodo(editingTodoId, data);
            } else {
                await api.createTodo(data);
            }
            closeModal();
            await loadTodos();
        } catch (err) {
            showAlert('modal-alert', err.message);
        } finally {
            setLoading('save-todo-btn', false);
        }
    });

    // Close modal on overlay click
    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'modal-overlay') closeModal();
    });

    // Escape to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

function openModal(todo = null) {
    editingTodoId = todo ? todo.id : null;
    document.getElementById('modal-title').textContent = todo ? 'Edit Todo' : 'New Todo';
    document.getElementById('todo-title').value = todo ? todo.title : '';
    document.getElementById('todo-desc').value = todo ? todo.description : '';
    document.getElementById('todo-priority').value = todo ? todo.priority : 3;

    const completedCheckbox = document.getElementById('todo-completed');
    const completedGroup = document.getElementById('completed-group');
    if (todo) {
        completedCheckbox.checked = todo.completed;
        completedGroup.style.display = '';
    } else {
        completedCheckbox.checked = false;
        completedGroup.style.display = 'none';
    }

    hideAlert('modal-alert');
    document.getElementById('modal-overlay').classList.add('active');
    document.getElementById('todo-title').focus();
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    editingTodoId = null;
}

async function toggleTodo(id) {
    const todo = allTodos.find(t => t.id === id);
    if (!todo) return;

    try {
        await api.updateTodo(id, {
            title: todo.title,
            description: todo.description,
            priority: todo.priority,
            completed: !todo.completed,
        });
        await loadTodos();
    } catch (err) {
        showAlert('page-alert', err.message);
    }
}

function editTodo(id) {
    const todo = allTodos.find(t => t.id === id);
    if (todo) openModal(todo);
}

async function deleteTodo(id) {
    if (!confirm('Delete this todo?')) return;

    try {
        await api.deleteTodo(id);
        await loadTodos();
    } catch (err) {
        showAlert('page-alert', err.message);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
