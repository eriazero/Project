/**
 * Tasks Page - Complete Task Management UI
 * Search, Filter, Sort, Archive, Restore, Statistics, CRUD
 */

// ─── State ───────────────────────────────────────────────────────────────────
let tasksState = {
    searchQuery: '',
    filterStatus: 'all',
    filterPriority: 'all',
    filterDueDate: 'all',
    sortBy: 'createdAt',
    sortDir: 'desc',
    showArchived: false
};

// ─── Render ───────────────────────────────────────────────────────────────────
function renderTasks() {
    return `
    <div class="tasks-page">

        <!-- Header -->
        <div class="tasks-header">
            <h1>Tasks</h1>
            <div class="tasks-header-actions">
                <button id="toggle-stats-btn" class="btn-secondary">📊 Stats</button>
                <button id="toggle-archived-btn" class="btn-secondary">🗂 Archived</button>
                <button id="add-task-btn" class="btn-primary">+ New Task</button>
            </div>
        </div>

        <!-- Statistics Panel (hidden by default) -->
        <div id="task-stats-panel" class="task-stats-panel" style="display:none">
        </div>

        <!-- Search + Filters + Sort -->
        <div class="tasks-toolbar">
            <div class="tasks-search-wrap">
                <input
                    id="task-search"
                    class="task-search-input"
                    type="text"
                    placeholder="🔍 Search tasks..."
                    value=""
                    autocomplete="off"
                />
            </div>

            <div class="tasks-filters">
                <select id="filter-status" class="task-filter-select">
                    <option value="all">All Status</option>
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Completed">Completed</option>
                </select>

                <select id="filter-priority" class="task-filter-select">
                    <option value="all">All Priority</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </select>

                <select id="filter-due" class="task-filter-select">
                    <option value="all">All Dates</option>
                    <option value="today">Due Today</option>
                    <option value="week">Due This Week</option>
                    <option value="overdue">Overdue</option>
                </select>

                <select id="sort-by" class="task-filter-select">
                    <option value="createdAt">Created Date</option>
                    <option value="updatedAt">Updated Date</option>
                    <option value="dueDate">Due Date</option>
                    <option value="priority">Priority</option>
                    <option value="title">Title</option>
                </select>

                <button id="sort-dir-btn" class="btn-secondary sort-dir-btn" title="Toggle sort direction">↓</button>
            </div>
        </div>

        <!-- Task List -->
        <div id="task-list-container" class="task-list">
        </div>

    </div>
    `;
}

// ─── Stats Panel ─────────────────────────────────────────────────────────────
function renderStatsPanel() {
    const s = TaskService.statistics();
    return `
        <div class="stats-row">
            <div class="stat-box">
                <div class="stat-box-label">Total</div>
                <div class="stat-box-value">${s.total}</div>
            </div>
            <div class="stat-box completed">
                <div class="stat-box-label">Completed</div>
                <div class="stat-box-value">${s.completed}</div>
            </div>
            <div class="stat-box pending">
                <div class="stat-box-label">Pending</div>
                <div class="stat-box-value">${s.pending}</div>
            </div>
            <div class="stat-box archived">
                <div class="stat-box-label">Archived</div>
                <div class="stat-box-value">${s.archived}</div>
            </div>
            <div class="stat-box rate">
                <div class="stat-box-label">Completion</div>
                <div class="stat-box-value">${s.rate}%</div>
                <div class="stat-progress-bar">
                    <div class="stat-progress-fill" style="width:${s.rate}%"></div>
                </div>
            </div>
        </div>
    `;
}

// ─── Task List ────────────────────────────────────────────────────────────────
function getFilteredTasks() {
    let tasks;

    if (tasksState.searchQuery) {
        tasks = TaskService.search(tasksState.searchQuery);
        // apply archived toggle
        if (!tasksState.showArchived) {
            tasks = tasks.filter(t => !t.archived);
        } else {
            tasks = tasks.filter(t => t.archived);
        }
    } else if (tasksState.showArchived) {
        tasks = TaskService.filter({ status: 'archived' });
    } else {
        tasks = TaskService.filter({
            status: tasksState.filterStatus,
            priority: tasksState.filterPriority,
            dueDate: tasksState.filterDueDate !== 'all' ? tasksState.filterDueDate : null
        });
    }

    return TaskService.sort(tasks, tasksState.sortBy, tasksState.sortDir);
}

function renderTaskList() {
    const container = document.getElementById('task-list-container');
    if (!container) return;

    const tasks = getFilteredTasks();

    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="tasks-empty">
                <p>${tasksState.showArchived ? '📭 No archived tasks.' : '✅ No tasks found.'}</p>
                ${!tasksState.showArchived ? '<button onclick="document.getElementById(\'add-task-btn\').click()" class="btn-primary">+ Create First Task</button>' : ''}
            </div>
        `;
        return;
    }

    container.innerHTML = tasks.map(task => buildTaskCard(task)).join('');
    bindTaskCardEvents();
}

function buildTaskCard(task) {
    const priorityColors = {
        Critical: '#ff4d4d',
        High: '#ff7a18',
        Medium: '#ffb84d',
        Low: '#00ff88'
    };
    const statusColors = {
        'Todo': '#7891aa',
        'In Progress': '#00d4ff',
        'Review': '#8b5cf6',
        'Completed': '#00ff88',
        'Archived': '#4a5568'
    };

    const pColor = priorityColors[task.priority] || '#7891aa';
    const sColor = statusColors[task.status] || '#7891aa';
    const dueBadge = task.dueDate ? buildDueBadge(task.dueDate) : '';
    const tagsHtml = (task.tags || []).map(tag =>
        `<span class="task-tag">${escapeText(tag)}</span>`
    ).join('');
    const progressHtml = typeof task.progress === 'number' && task.progress > 0 ? `
        <div class="task-progress-bar">
            <div class="task-progress-fill" style="width:${task.progress}%"></div>
            <span class="task-progress-label">${task.progress}%</span>
        </div>
    ` : '';
    const subtasksCount = (task.subtasks || []).length;
    const subtasksDone  = (task.subtasks || []).filter(s => s.done).length;
    const subtasksHtml  = subtasksCount > 0
        ? `<span class="task-subtask-count">☑ ${subtasksDone}/${subtasksCount}</span>`
        : '';

    const archiveBtn = !task.archived
        ? `<button class="btn-icon task-archive-btn" data-id="${task.id}" title="Archive">🗂</button>`
        : `<button class="btn-icon task-restore-btn" data-id="${task.id}" title="Restore">♻️</button>`;

    return `
        <div class="task-card ${task.archived ? 'task-archived' : ''}" data-id="${task.id}">
            <div class="task-card-left">
                <div class="task-priority-bar" style="background:${pColor}"></div>
                <div class="task-card-body">
                    <div class="task-card-title">${escapeText(task.title)}</div>
                    ${task.description ? `<div class="task-card-desc">${escapeText(task.description)}</div>` : ''}
                    <div class="task-card-meta">
                        <span class="task-badge" style="background:${sColor}22;color:${sColor};border:1px solid ${sColor}44">${task.status}</span>
                        <span class="task-badge" style="background:${pColor}22;color:${pColor};border:1px solid ${pColor}44">${task.priority}</span>
                        ${dueBadge}
                        ${subtasksHtml}
                        ${tagsHtml}
                    </div>
                    ${progressHtml}
                </div>
            </div>
            <div class="task-card-actions">
                <button class="btn-icon task-edit-btn" data-id="${task.id}" title="Edit">✏️</button>
                ${archiveBtn}
                <button class="btn-icon task-delete-btn" data-id="${task.id}" title="Delete">🗑</button>
            </div>
        </div>
    `;
}

function buildDueBadge(dueDate) {
    const due  = new Date(dueDate);
    const now  = new Date();
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = due < now && !dueDate.startsWith(today);
    const isToday   = dueDate.startsWith(today);
    const color  = isOverdue ? '#ff4d4d' : isToday ? '#ffb84d' : '#7891aa';
    const label  = isOverdue ? '⚠ ' : isToday ? '📅 Today' : '📅 ';
    const dateStr = isToday ? 'Today' : due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `<span class="task-badge" style="color:${color};border:1px solid ${color}44">${label}${isToday ? '' : dateStr}</span>`;
}

function escapeText(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function bindTaskCardEvents() {
    document.querySelectorAll('.task-edit-btn').forEach(btn => {
        btn.onclick = () => openTaskModal(Number(btn.dataset.id));
    });

    document.querySelectorAll('.task-delete-btn').forEach(btn => {
        btn.onclick = () => {
            if (confirm('Delete this task?')) {
                try {
                    TaskService.delete(Number(btn.dataset.id));
                    renderTaskList();
                    refreshStatsIfVisible();
                } catch (e) {
                    NotificationManager.error('Could not delete: ' + e.message);
                }
            }
        };
    });

    document.querySelectorAll('.task-archive-btn').forEach(btn => {
        btn.onclick = () => {
            try {
                TaskService.archive(Number(btn.dataset.id));
                renderTaskList();
                refreshStatsIfVisible();
            } catch (e) {
                NotificationManager.error('Could not archive: ' + e.message);
            }
        };
    });

    document.querySelectorAll('.task-restore-btn').forEach(btn => {
        btn.onclick = () => {
            try {
                TaskService.restore(Number(btn.dataset.id));
                renderTaskList();
                refreshStatsIfVisible();
            } catch (e) {
                NotificationManager.error('Could not restore: ' + e.message);
            }
        };
    });
}

function refreshStatsIfVisible() {
    const panel = document.getElementById('task-stats-panel');
    if (panel && panel.style.display !== 'none') {
        panel.innerHTML = renderStatsPanel();
    }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
function initTasksPage() {
    // reset state
    tasksState = {
        searchQuery: '',
        filterStatus: 'all',
        filterPriority: 'all',
        filterDueDate: 'all',
        sortBy: 'createdAt',
        sortDir: 'desc',
        showArchived: false
    };

    renderTaskList();

    // New Task button
    const addBtn = document.getElementById('add-task-btn');
    if (addBtn) {
        addBtn.onclick = () => openTaskModal();
    }

    // Stats toggle
    const statsBtn = document.getElementById('toggle-stats-btn');
    if (statsBtn) {
        statsBtn.onclick = () => {
            const panel = document.getElementById('task-stats-panel');
            if (!panel) return;
            if (panel.style.display === 'none') {
                panel.innerHTML = renderStatsPanel();
                panel.style.display = 'block';
                statsBtn.textContent = '📊 Hide Stats';
            } else {
                panel.style.display = 'none';
                statsBtn.textContent = '📊 Stats';
            }
        };
    }

    // Archived toggle
    const archivedBtn = document.getElementById('toggle-archived-btn');
    if (archivedBtn) {
        archivedBtn.onclick = () => {
            tasksState.showArchived = !tasksState.showArchived;
            archivedBtn.textContent = tasksState.showArchived ? '📋 Active Tasks' : '🗂 Archived';
            renderTaskList();
        };
    }

    // Search (real-time)
    const searchInput = document.getElementById('task-search');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                tasksState.searchQuery = e.target.value.trim();
                renderTaskList();
            }, 200);
        });
        searchInput.focus();
    }

    // Filters
    const filterStatus = document.getElementById('filter-status');
    if (filterStatus) {
        filterStatus.addEventListener('change', (e) => {
            tasksState.filterStatus = e.target.value;
            renderTaskList();
        });
    }

    const filterPriority = document.getElementById('filter-priority');
    if (filterPriority) {
        filterPriority.addEventListener('change', (e) => {
            tasksState.filterPriority = e.target.value;
            renderTaskList();
        });
    }

    const filterDue = document.getElementById('filter-due');
    if (filterDue) {
        filterDue.addEventListener('change', (e) => {
            tasksState.filterDueDate = e.target.value;
            renderTaskList();
        });
    }

    // Sort by
    const sortByEl = document.getElementById('sort-by');
    if (sortByEl) {
        sortByEl.addEventListener('change', (e) => {
            tasksState.sortBy = e.target.value;
            renderTaskList();
        });
    }

    // Sort direction toggle
    const sortDirBtn = document.getElementById('sort-dir-btn');
    if (sortDirBtn) {
        sortDirBtn.onclick = () => {
            tasksState.sortDir = tasksState.sortDir === 'desc' ? 'asc' : 'desc';
            sortDirBtn.textContent = tasksState.sortDir === 'desc' ? '↓' : '↑';
            renderTaskList();
        };
    }
}

// ─── Helper to refresh task list from external calls ─────────────────────────
function refreshTasksPage() {
    const container = document.getElementById('task-list-container');
    if (container) {
        renderTaskList();
        refreshStatsIfVisible();
    }
}
