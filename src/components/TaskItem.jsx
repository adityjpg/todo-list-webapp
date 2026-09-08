import { formatDue, isOverdue, isDueToday } from '../lib/model.js'

export default function TaskItem({ task, listName, selected, today, onToggle, onOpen, onDelete }) {
  const overdue = isOverdue(task, today)
  const dueToday = isDueToday(task, today)

  return (
    <li className={`task${task.done ? ' is-done' : ''}${selected ? ' is-selected' : ''}`}>
      <input
        type="checkbox"
        className="task-check"
        checked={task.done}
        onChange={() => onToggle(task.id)}
        aria-label={task.done ? `Mark “${task.title}” as not done` : `Complete “${task.title}”`}
      />
      <button type="button" className="task-body" onClick={() => onOpen(task.id)}>
        <span className="task-title">{task.title}</span>
        <span className="task-meta">
          {task.due && (
            <span className={`task-due${overdue ? ' is-overdue' : ''}${dueToday ? ' is-today' : ''}`}>
              {formatDue(task.due, today)}
            </span>
          )}
          {listName && <span className="task-list">{listName}</span>}
          {task.notes.trim() && (
            <span className="task-notes-dot" title="Has notes" aria-label="Has notes">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M6 6.5h12M6 11h12M6 15.5h7" />
              </svg>
            </span>
          )}
        </span>
      </button>
      <button
        type="button"
        className="icon-btn icon-btn-sm task-delete"
        onClick={() => onDelete(task.id)}
        aria-label={`Delete “${task.title}”`}
        title="Delete"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M5.5 7h13M9.8 7V5.4a1.2 1.2 0 0 1 1.2-1.2h2a1.2 1.2 0 0 1 1.2 1.2V7M7.2 7l.8 11.4a1.4 1.4 0 0 0 1.4 1.3h5.2a1.4 1.4 0 0 0 1.4-1.3L17.8 7" />
        </svg>
      </button>
    </li>
  )
}
