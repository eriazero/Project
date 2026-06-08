/**
 * TaskService - Complete Task Management Service
 * Integrates with Database, Storage, EventManager, NotificationManager
 */

const TaskService = {

    // ─── CRUD ────────────────────────────────────────────────────────────────

    getAll() {
        return Storage.load('tasks') || [];
    },

    save(tasks) {
        Storage.save('tasks', tasks);
    },

    getById(id) {
        const tasks = this.getAll();
        return tasks.find(t => t.id === id) || null;
    },

    create(data) {
        const tasks = this.getAll();
        const id = tasks.length > 0
            ? Math.max(...tasks.map(t => t.id)) + 1
            : 1;

        const task = {
            id,
            title: data.title || 'Untitled',
            description: data.description || '',
            priority: data.priority || 'Medium',
            status: data.status || 'Todo',
            dueDate: data.dueDate || '',
            tags: Array.isArray(data.tags) ? data.tags : [],
            notes: data.notes || '',
            progress: typeof data.progress === 'number' ? data.progress : 0,
            subtasks: Array.isArray(data.subtasks) ? data.subtasks : [],
            archived: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        tasks.push(task);
        this.save(tasks);

        EventManager.emit(EventTypes.TASK_CREATED, task);
        NotificationManager.success(`Task "${task.title}" created`);
        if (typeof updateDashboard === 'function') updateDashboard();

        return task;
    },

    // alias for legacy callers
    add(data) {
        return this.create(data);
    },

    update(id, data) {
        const tasks = this.getAll();
        const index = tasks.findIndex(t => t.id === id);
        if (index === -1) throw new Error(`Task ${id} not found`);

        const updated = {
            ...tasks[index],
            ...data,
            id,
            updatedAt: new Date().toISOString()
        };

        tasks[index] = updated;
        this.save(tasks);

        EventManager.emit(EventTypes.TASK_UPDATED, updated);
        NotificationManager.success(`Task "${updated.title}" updated`);
        if (typeof updateDashboard === 'function') updateDashboard();

        return updated;
    },

    delete(id) {
        const tasks = this.getAll();
        const task = tasks.find(t => t.id === id);
        if (!task) throw new Error(`Task ${id} not found`);

        const filtered = tasks.filter(t => t.id !== id);
        this.save(filtered);

        EventManager.emit(EventTypes.TASK_DELETED, { id });
        NotificationManager.success(`Task "${task.title}" deleted`);
        if (typeof updateDashboard === 'function') updateDashboard();

        return true;
    },

    // ─── LIFECYCLE ───────────────────────────────────────────────────────────

    archive(id) {
        const task = this.getById(id);
        if (!task) throw new Error(`Task ${id} not found`);
        return this.update(id, { status: 'Archived', archived: true });
    },

    restore(id) {
        const task = this.getById(id);
        if (!task) throw new Error(`Task ${id} not found`);
        const restoredStatus = task.previousStatus || 'Todo';
        return this.update(id, {
            status: restoredStatus,
            archived: false,
            previousStatus: undefined
        });
    },

    // ─── SEARCH / FILTER / SORT ───────────────────────────────────────────

    search(query) {
        if (!query || !query.trim()) return this.getAll();
        const q = query.toLowerCase().trim();
        return this.getAll().filter(task => {
            const inTitle = task.title.toLowerCase().includes(q);
            const inDesc  = (task.description || '').toLowerCase().includes(q);
            const inTags  = (task.tags || []).some(tag => tag.toLowerCase().includes(q));
            return inTitle || inDesc || inTags;
        });
    },

    filter({ status, priority, dueDate } = {}) {
        let tasks = this.getAll();

        if (status && status !== 'all') {
            if (status === 'archived') {
                tasks = tasks.filter(t => t.archived === true);
            } else {
                tasks = tasks.filter(t => t.status === status && !t.archived);
            }
        } else if (!status || status === 'all') {
            // default: exclude archived unless explicitly requested
            tasks = tasks.filter(t => !t.archived);
        }

        if (priority && priority !== 'all') {
            tasks = tasks.filter(t => t.priority === priority);
        }

        if (dueDate === 'overdue') {
            const now = new Date();
            tasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Completed');
        } else if (dueDate === 'today') {
            const today = new Date().toISOString().split('T')[0];
            tasks = tasks.filter(t => t.dueDate && t.dueDate.startsWith(today));
        } else if (dueDate === 'week') {
            const weekAhead = new Date();
            weekAhead.setDate(weekAhead.getDate() + 7);
            tasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) <= weekAhead);
        }

        return tasks;
    },

    sort(tasks, sortBy = 'createdAt', direction = 'desc') {
        const priorityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };

        return [...tasks].sort((a, b) => {
            let valA, valB;

            if (sortBy === 'priority') {
                valA = priorityOrder[a.priority] || 0;
                valB = priorityOrder[b.priority] || 0;
                return direction === 'desc' ? valB - valA : valA - valB;
            }

            if (sortBy === 'title') {
                valA = (a.title || '').toLowerCase();
                valB = (b.title || '').toLowerCase();
                return direction === 'asc'
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            }

            if (sortBy === 'dueDate') {
                valA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                valB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
            } else {
                // createdAt, updatedAt
                valA = a[sortBy] ? new Date(a[sortBy]).getTime() : 0;
                valB = b[sortBy] ? new Date(b[sortBy]).getTime() : 0;
            }

            return direction === 'desc' ? valB - valA : valA - valB;
        });
    },

    // ─── STATISTICS ──────────────────────────────────────────────────────────

    statistics() {
        const all = this.getAll();
        const total    = all.length;
        const archived = all.filter(t => t.archived).length;
        const active   = all.filter(t => !t.archived);
        const completed = active.filter(t => t.status === 'Completed').length;
        const pending   = active.filter(t => t.status !== 'Completed').length;
        const rate = active.length > 0
            ? Math.round((completed / active.length) * 100)
            : 0;

        return { total, completed, pending, archived, rate };
    }

};
