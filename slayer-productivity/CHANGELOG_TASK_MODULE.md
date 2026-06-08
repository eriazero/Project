# Changelog — Task Module

## [2.0.0] — 2026-06-09

### Added — TaskService
- `getById(id)` — fetch single task by numeric ID
- `create(data)` — full task creation with auto-ID, timestamps, events, notifications
- `add(data)` — alias to `create()` for backward compatibility
- `archive(id)` — soft-archive: sets `archived=true`, status='Archived'
- `restore(id)` — unarchive: clears `archived`, restores previous or default status
- `search(query)` — real-time text search across title, description, tags
- `filter({status, priority, dueDate})` — multi-criteria filtering with archived support
- `sort(tasks, sortBy, direction)` — sort by createdAt/updatedAt/dueDate/priority/title; asc/desc
- `statistics()` — returns {total, completed, pending, archived, rate}

### Added — Tasks UI (tasks.js)
- Search bar with real-time 200ms debounce
- Status filter dropdown (All/Todo/In Progress/Review/Completed)
- Priority filter dropdown (All/Critical/High/Medium/Low)
- Due Date filter (All/Today/This Week/Overdue)
- Sort selector (5 options) with direction toggle button
- Archive view toggle (active ↔ archived)
- Statistics panel (toggle show/hide) with progress bar
- Task cards: priority color bar, status/priority badges, due date badge, tags, progress bar, subtask count
- Per-card actions: Edit, Archive/Restore, Delete
- Empty state with CTA button

### Added — Task Modal (taskModal.js)
- Full rewrite: no Sanitizer dependency (builds DOM directly)
- Fields: title, description, priority, status, due date, progress slider, tags, notes
- Subtasks: add/remove/toggle-done inline
- Archive/Restore button in edit mode
- Delete button with confirm dialog
- Close on overlay click or × button
- Triggers `refreshTasksPage()` and `updateDashboard()` after save

### Fixed
- `Document.addEventListener` (capital D) in `database.js` — caused silent init failure
- `NotificationManager.show()` was undefined — added alias in `notificationManager.js`
- `TaskService.create()` was missing — `taskModal.js` called it on submit (TypeError)
- `Sanitizer.sanitizeHTML()` stripped all `<input>`, `<select>`, `<form>` etc — modal was blank
- Conflicting `openTaskModal()`/`editTask()` in `modal.js` — removed legacy prompt-based versions
- Dashboard not refreshing after task changes — added `updateDashboard()` hook

### Changed
- `modal.js` — removed task-related functions (now handled by `taskModal.js`)
- `dashboard.js` — added `updateDashboard()` helper
- `tasks.css` — full redesign: priority bars, badge system, toolbar, stats panel, modal styles

---

## Readiness: 100% ✅
