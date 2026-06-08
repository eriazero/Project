/**
 * Task Modal Component
 * Handles creation and editing of tasks with full form validation
 */

let currentEditingTaskId = null;

function openTaskModal(taskId = null) {
    currentEditingTaskId = taskId || null;
    const task = taskId ? TaskService.getById(Number(taskId)) : null;

    // Remove any existing modal
    const existing = document.getElementById('task-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'task-modal-overlay';
    modal.id = 'task-modal';

    const title      = task ? 'Edit Task' : 'Create New Task';
    const buttonText = task ? 'Update Task' : 'Create Task';

    const subtasksHtml = buildSubtasksHtml(task ? (task.subtasks || []) : []);

    modal.innerHTML = `
        <div class="task-modal">
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="modal-close" id="task-modal-close">&times;</button>
            </div>

            <div class="task-form-body">

                <div class="form-group">
                    <label for="task-title">Title *</label>
                    <input
                        type="text"
                        id="task-title"
                        name="title"
                        placeholder="Enter task title"
                        value="${task ? _esc(task.title) : ''}"
                        required
                        autocomplete="off"
                    />
                </div>

                <div class="form-group">
                    <label for="task-description">Description</label>
                    <textarea
                        id="task-description"
                        name="description"
                        placeholder="Enter task description"
                        rows="3"
                    >${task ? _esc(task.description) : ''}</textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="task-priority">Priority</label>
                        <select id="task-priority" name="priority">
                            <option value="Low"      ${task && task.priority === 'Low'      ? 'selected' : ''}>Low</option>
                            <option value="Medium"   ${task && task.priority === 'Medium'   ? 'selected' : (!task ? 'selected' : '')}>Medium</option>
                            <option value="High"     ${task && task.priority === 'High'     ? 'selected' : ''}>High</option>
                            <option value="Critical" ${task && task.priority === 'Critical' ? 'selected' : ''}>Critical</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="task-status">Status</label>
                        <select id="task-status" name="status">
                            <option value="Todo"        ${task && task.status === 'Todo'        ? 'selected' : (!task ? 'selected' : '')}>Todo</option>
                            <option value="In Progress" ${task && task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Review"      ${task && task.status === 'Review'      ? 'selected' : ''}>Review</option>
                            <option value="Completed"   ${task && task.status === 'Completed'   ? 'selected' : ''}>Completed</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="task-dueDate">Due Date</label>
                        <input
                            type="date"
                            id="task-dueDate"
                            name="dueDate"
                            value="${task && task.dueDate ? task.dueDate.split('T')[0] : ''}"
                        />
                    </div>

                    <div class="form-group">
                        <label for="task-progress">Progress (${task ? task.progress || 0 : 0}%)</label>
                        <input
                            type="range"
                            id="task-progress"
                            name="progress"
                            min="0" max="100" step="5"
                            value="${task ? (task.progress || 0) : 0}"
                        />
                    </div>
                </div>

                <div class="form-group">
                    <label for="task-tags">Tags <small>(comma-separated)</small></label>
                    <input
                        type="text"
                        id="task-tags"
                        name="tags"
                        placeholder="e.g. work, urgent, important"
                        value="${task && task.tags ? task.tags.join(', ') : ''}"
                        autocomplete="off"
                    />
                </div>

                <div class="form-group">
                    <label for="task-notes">Notes</label>
                    <textarea
                        id="task-notes"
                        name="notes"
                        placeholder="Additional notes"
                        rows="2"
                    >${task ? _esc(task.notes) : ''}</textarea>
                </div>

                <!-- Subtasks -->
                <div class="form-group">
                    <label>Subtasks</label>
                    <div id="subtasks-container">
                        ${subtasksHtml}
                    </div>
                    <button type="button" id="add-subtask-btn" class="btn-secondary btn-sm">+ Add Subtask</button>
                </div>

            </div>

            <div class="form-actions">
                <button type="button" id="task-cancel-btn" class="btn-secondary">Cancel</button>
                <button type="button" id="task-submit-btn" class="btn-primary">${buttonText}</button>
                ${task ? `<button type="button" id="task-archive-modal-btn" class="btn-warning">${task.archived ? '♻️ Restore' : '🗂 Archive'}</button>` : ''}
                ${task ? `<button type="button" id="task-delete-modal-btn" class="btn-danger">Delete</button>` : ''}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    bindModalEvents(task);
}

function buildSubtasksHtml(subtasks) {
    if (!subtasks || subtasks.length === 0) return '';
    return subtasks.map((s, i) => `
        <div class="subtask-row" data-index="${i}">
            <input type="checkbox" class="subtask-done" ${s.done ? 'checked' : ''} />
            <input type="text" class="subtask-title-input" value="${_esc(s.title || '')}" placeholder="Subtask title" />
            <button type="button" class="subtask-remove btn-icon">✕</button>
        </div>
    `).join('');
}

function _esc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function bindModalEvents(task) {
    const modal = document.getElementById('task-modal');

    // Close buttons
    document.getElementById('task-modal-close').onclick = closeTaskModal;
    document.getElementById('task-cancel-btn').onclick  = closeTaskModal;

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeTaskModal();
    });

    // Progress label live update
    const progressInput = document.getElementById('task-progress');
    const progressLabel = modal.querySelector('label[for="task-progress"]');
    if (progressInput && progressLabel) {
        progressInput.addEventListener('input', () => {
            progressLabel.innerHTML = `Progress <small>(${progressInput.value}%)</small>`;
        });
    }

    // Add subtask
    document.getElementById('add-subtask-btn').onclick = () => {
        const container = document.getElementById('subtasks-container');
        const idx = container.querySelectorAll('.subtask-row').length;
        const row = document.createElement('div');
        row.className = 'subtask-row';
        row.dataset.index = idx;
        row.innerHTML = `
            <input type="checkbox" class="subtask-done" />
            <input type="text" class="subtask-title-input" placeholder="Subtask title" />
            <button type="button" class="subtask-remove btn-icon">✕</button>
        `;
        container.appendChild(row);
        row.querySelector('.subtask-title-input').focus();
        // Bind remove for new row
        row.querySelector('.subtask-remove').onclick = () => row.remove();
    };

    // Bind existing subtask remove buttons
    document.querySelectorAll('.subtask-remove').forEach(btn => {
        btn.onclick = () => btn.closest('.subtask-row').remove();
    });

    // Submit
    document.getElementById('task-submit-btn').onclick = handleTaskFormSubmit;

    // Archive / Restore
    const archiveBtn = document.getElementById('task-archive-modal-btn');
    if (archiveBtn) {
        archiveBtn.onclick = () => {
            if (task.archived) {
                try { TaskService.restore(Number(currentEditingTaskId)); }
                catch (e) { NotificationManager.error(e.message); return; }
            } else {
                try { TaskService.archive(Number(currentEditingTaskId)); }
                catch (e) { NotificationManager.error(e.message); return; }
            }
            closeTaskModal();
            if (typeof refreshTasksPage === 'function') refreshTasksPage();
        };
    }

    // Delete
    const deleteBtn = document.getElementById('task-delete-modal-btn');
    if (deleteBtn) {
        deleteBtn.onclick = () => {
            if (confirm('Delete this task permanently?')) {
                try {
                    TaskService.delete(Number(currentEditingTaskId));
                    closeTaskModal();
                    if (typeof refreshTasksPage === 'function') refreshTasksPage();
                } catch (e) {
                    NotificationManager.error('Delete failed: ' + e.message);
                }
            }
        };
    }
}

function closeTaskModal() {
    const modal = document.getElementById('task-modal');
    if (modal) modal.remove();
    currentEditingTaskId = null;
}

function handleTaskFormSubmit() {
    const titleEl  = document.getElementById('task-title');
    const title    = titleEl ? titleEl.value.trim() : '';

    if (!title) {
        NotificationManager.error('Task title is required');
        if (titleEl) titleEl.focus();
        return;
    }

    const descEl    = document.getElementById('task-description');
    const priorityEl = document.getElementById('task-priority');
    const statusEl   = document.getElementById('task-status');
    const dueDateEl  = document.getElementById('task-dueDate');
    const tagsEl     = document.getElementById('task-tags');
    const notesEl    = document.getElementById('task-notes');
    const progressEl = document.getElementById('task-progress');

    // Collect subtasks
    const subtasks = [];
    document.querySelectorAll('#subtasks-container .subtask-row').forEach(row => {
        const titleInput = row.querySelector('.subtask-title-input');
        const doneInput  = row.querySelector('.subtask-done');
        const t = titleInput ? titleInput.value.trim() : '';
        if (t) {
            subtasks.push({ title: t, done: doneInput ? doneInput.checked : false });
        }
    });

    const taskData = {
        title,
        description: descEl    ? descEl.value.trim()    : '',
        priority:    priorityEl ? priorityEl.value       : 'Medium',
        status:      statusEl   ? statusEl.value         : 'Todo',
        dueDate:     dueDateEl  ? dueDateEl.value        : '',
        tags: tagsEl
            ? tagsEl.value.split(',').map(t => t.trim()).filter(Boolean)
            : [],
        notes:    notesEl    ? notesEl.value.trim()    : '',
        progress: progressEl ? Number(progressEl.value) : 0,
        subtasks
    };

    try {
        if (currentEditingTaskId) {
            TaskService.update(Number(currentEditingTaskId), taskData);
        } else {
            TaskService.create(taskData);
        }
        closeTaskModal();
        if (typeof refreshTasksPage === 'function') refreshTasksPage();
        // Also refresh dashboard if visible
        const dashPage = document.querySelector('.dashboard-page');
        if (dashPage && typeof renderDashboard === 'function') {
            const container = document.getElementById('dashboard-page');
            if (container && container.querySelector('.dashboard-page')) {
                container.innerHTML = renderDashboard();
            }
        }
    } catch (e) {
        console.error('Task save error:', e);
        NotificationManager.error('Error saving task: ' + e.message);
    }
}

function editTask(taskId) {
    openTaskModal(taskId);
}
